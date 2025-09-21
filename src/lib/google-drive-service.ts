import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { parseDocument } from './document-parser';
import { saveToDatabase } from './database';

// Google Drive API configuration
const GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

let driveService: any = null;

// Initialize Google Drive service
async function initializeDriveService() {
  if (!GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY not found in environment variables');
  }

  if (!GOOGLE_DRIVE_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not found in environment variables');
  }

  try {
    // Parse the service account key
    const serviceAccountKey = JSON.parse(GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY);
    
    // Create JWT client
    const auth = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });

    // Initialize Drive API
    driveService = google.drive({ version: 'v3', auth });
    
    console.log('Google Drive service initialized successfully');
    return driveService;
  } catch (error) {
    console.error('Failed to initialize Google Drive service:', error);
    throw new Error(`Google Drive initialization failed: ${error.message}`);
  }
}

// Get all files from the receipts folder
export async function getReceiptsFromDrive(): Promise<any[]> {
  try {
    if (!driveService) {
      await initializeDriveService();
    }

    console.log('Fetching files from Google Drive folder:', GOOGLE_DRIVE_FOLDER_ID);

    // List files in the folder
    const response = await driveService.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    const files = response.data.files || [];
    console.log(`Found ${files.length} files in receipts folder`);

    return files;
  } catch (error) {
    console.error('Error fetching files from Google Drive:', error);
    throw new Error(`Failed to fetch files from Google Drive: ${error.message}`);
  }
}

// Download and process a file from Google Drive
export async function downloadAndProcessFile(fileId: string, fileName: string, mimeType: string): Promise<any> {
  try {
    if (!driveService) {
      await initializeDriveService();
    }

    console.log(`Downloading file: ${fileName} (${fileId})`);

    // Download file content
    const response = await driveService.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    });

    // Convert buffer to base64 for Gemini processing
    const buffer = Buffer.from(response.data);
    const base64Content = buffer.toString('base64');

    console.log(`File downloaded, size: ${buffer.length} bytes`);

    // Process the document using Gemini Vision
    const processedData = await processDriveDocument(base64Content, fileName, mimeType);

    // Save to database
    const savedData = await saveToDatabase({
      ...processedData,
      filename: fileName,
      file_path: `drive://${fileId}` // Use drive:// prefix to indicate it's from Google Drive
    });

    console.log(`File processed and saved: ${fileName}`);
    return savedData;

  } catch (error) {
    console.error(`Error processing file ${fileName}:`, error);
    throw new Error(`Failed to process file ${fileName}: ${error.message}`);
  }
}

// Process document using Gemini Vision (similar to document-parser but for Drive files)
async function processDriveDocument(base64Content: string, fileName: string, mimeType: string): Promise<any> {
  try {
    console.log(`Processing Drive document: ${fileName} (${mimeType})`);

    // Import Google AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Get API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log('Analyzing document with Gemini Vision...');
    
    // Create analysis prompt
    const prompt = `Extract financial information from this document and return it in JSON format with the following fields:
    - vendor: company/vendor name
    - amount: total amount (number)
    - date: transaction date (YYYY-MM-DD format)
    - invoice_number: invoice/receipt number
    - items: array of line items with description and amount
    - insights: array of insights about the document
    - confidence_score: confidence level (0-1)
    
    If any field cannot be determined, use null. Return only valid JSON.`;

    // Determine MIME type for Gemini
    let geminiMimeType = mimeType;
    if (mimeType === 'application/pdf') {
      geminiMimeType = 'application/pdf';
    } else if (mimeType.startsWith('image/')) {
      geminiMimeType = 'image/jpeg'; // Gemini expects image/jpeg for most image types
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Content,
          mimeType: geminiMimeType
        }
      },
      prompt
    ]);
    
    const response = await result.response;
    const extractedText = response.text();
    
    console.log('Gemini Vision analysis completed');
    console.log('Raw response:', extractedText);
    
    // Parse JSON response
    let parsedData;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback to basic structure
      parsedData = {
        vendor: 'Unknown',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        invoice_number: 'N/A',
        items: [],
        insights: [{
          type: 'parse_error',
          message: 'Failed to parse document with AI',
          severity: 'error'
        }],
        confidence_score: 0,
        processed_at: new Date().toISOString(),
        status: 'error'
      };
    }

    // Add metadata
    return {
      ...parsedData,
      processed_at: new Date().toISOString(),
      status: 'processed',
      source: 'google_drive'
    };

  } catch (error) {
    console.error('Drive document processing error:', error);
    throw new Error(`Failed to process Drive document: ${error.message}`);
  }
}

// Process all receipts from Google Drive folder
export async function processAllReceiptsFromDrive(): Promise<any[]> {
  try {
    console.log('Starting batch processing of Google Drive receipts...');
    
    const files = await getReceiptsFromDrive();
    const processedFiles = [];
    
    for (const file of files) {
      try {
        console.log(`Processing: ${file.name}`);
        const result = await downloadAndProcessFile(file.id, file.name, file.mimeType);
        processedFiles.push({
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          processedData: result
        });
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        processedFiles.push({
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          error: error.message
        });
      }
    }
    
    console.log(`Batch processing completed. ${processedFiles.length} files processed.`);
    return processedFiles;
    
  } catch (error) {
    console.error('Batch processing error:', error);
    throw new Error(`Failed to process receipts from Google Drive: ${error.message}`);
  }
}

// Get file info without downloading
export async function getFileInfo(fileId: string): Promise<any> {
  try {
    if (!driveService) {
      await initializeDriveService();
    }

    const response = await driveService.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink'
    });

    return response.data;
  } catch (error) {
    console.error(`Error getting file info for ${fileId}:`, error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}
