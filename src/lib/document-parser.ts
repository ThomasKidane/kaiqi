import { readFile } from 'fs/promises';
import { join } from 'path';
import { analyzeDocumentWithLLM, ExtractedFinancialData } from './llm-service';

// Note: PDF parsing simplified to avoid dependency issues

// Real OCR implementation using Google Gemini Vision
const extractTextFromImage = async (imagePath: string): Promise<string> => {
  console.log('Starting Gemini Vision analysis for image:', imagePath);
  
  try {
    console.log('Using Gemini 2.5 Flash with vision capabilities...');
    
    // Import Google AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Get API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log('Reading image file...');
    const fs = await import('fs/promises');
    const imageBuffer = await fs.readFile(imagePath);
    
    console.log('Analyzing image with Gemini Vision...');
    const prompt = "Extract all text from this image. Return only the raw text content, no formatting or explanations.";
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      },
      prompt
    ]);
    
    const response = await result.response;
    const extractedText = response.text();
    
    console.log('Gemini Vision analysis completed, extracted text length:', extractedText.length);
    console.log('Extracted text:', extractedText);
    
    if (extractedText.trim().length > 10) {
      return extractedText;
    } else {
      console.log('Gemini Vision returned minimal text, treating as non-parseable');
      return `IMAGE_NON_PARSEABLE:${imagePath.split('/').pop()}`;
    }
  } catch (error) {
    console.error('Gemini Vision analysis failed with error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    // Fallback: return a basic message if analysis fails
    return `IMAGE_NON_PARSEABLE:${imagePath.split('/').pop()}`;
  }
};

// PDF processing using Gemini Vision directly
const extractTextFromPDF = async (pdfPath: string): Promise<string> => {
  console.log('Processing PDF file with Gemini Vision:', pdfPath);
  
  try {
    console.log('Using Gemini 2.5 Flash for PDF analysis...');
    
    // Import Google AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Get API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log('Reading PDF file...');
    const fs = await import('fs/promises');
    const pdfBuffer = await fs.readFile(pdfPath);
    
    console.log('Analyzing PDF with Gemini Vision...');
    const prompt = "Extract all text from this PDF document. Return only the raw text content, no formatting or explanations.";
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      prompt
    ]);
    
    const response = await result.response;
    const extractedText = response.text();
    
    console.log('Gemini Vision PDF analysis completed, extracted text length:', extractedText.length);
    console.log('Extracted text:', extractedText);
    
    if (extractedText.trim().length > 10) {
      return extractedText;
    } else {
      console.log('Gemini Vision returned minimal text, treating as non-parseable');
      const filename = pdfPath.split('/').pop();
      return `PDF_NON_PARSEABLE:${filename}`;
    }
    
  } catch (error) {
    console.error('Gemini Vision PDF analysis failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    // Mark as non-parseable if analysis fails
    const filename = pdfPath.split('/').pop();
    return `PDF_NON_PARSEABLE:${filename}`;
  }
};


// Real CSV parsing
const extractTextFromCSV = async (csvPath: string): Promise<string> => {
  console.log('Parsing CSV file:', csvPath);
  const content = await readFile(csvPath, 'utf-8');
  console.log('CSV parsing completed, content length:', content.length);
  return content;
};

// Real Excel parsing using xlsx
const extractTextFromExcel = async (excelPath: string): Promise<string> => {
  console.log('Parsing Excel file:', excelPath);
  const XLSX = await import('xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  const text = jsonData.map((row: any) => {
    const entries = Object.entries(row as Record<string, unknown>);
    return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
  }).join('\n');
  
  console.log('Excel parsing completed, extracted text length:', text.length);
  return text;
};

// Note: All regex-based extraction has been replaced with LLM-powered analysis
// The LLM service handles all data extraction, validation, and insights generation

export async function parseDocument(filePath: string, mimeType: string) {
  try {
    console.log(`Parsing document: ${filePath} (${mimeType})`);
    let extractedText: string;

    if (mimeType.startsWith('image/')) {
      // Real OCR for images
      extractedText = await extractTextFromImage(filePath);
    } else if (mimeType === 'application/pdf') {
      // Real PDF parsing
      extractedText = await extractTextFromPDF(filePath);
    } else if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
      // Real CSV parsing
      extractedText = await extractTextFromCSV(filePath);
    } else if (mimeType.includes('spreadsheet') || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      // Real Excel parsing
      extractedText = await extractTextFromExcel(filePath);
    } else if (mimeType === 'text/plain' || filePath.endsWith('.txt')) {
      // Text file parsing
      extractedText = await readFile(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    console.log('=== RAW EXTRACTED TEXT ===');
    console.log('Length:', extractedText.length);
    console.log('Full text:', extractedText);
    console.log('========================');

    // Extract structured data using LLM-powered parsing
    const parsedData = await analyzeDocumentWithLLM(extractedText, filePath);

    // Add metadata
    const result = {
      ...parsedData,
      file_path: filePath,
      extracted_text: extractedText, // Store extracted text for caching
      raw_text: extractedText // Store raw text for debugging
    };

    console.log('Document parsing completed successfully');
    return result;

  } catch (error) {
    console.error('Document parsing error:', error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
