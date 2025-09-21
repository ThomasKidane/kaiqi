import { NextRequest, NextResponse } from 'next/server';
import { 
  getReceiptsFromDrive, 
  processAllReceiptsFromDrive, 
  downloadAndProcessFile,
  getFileInfo 
} from '@/lib/google-drive-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list':
        // List all files in the receipts folder
        const files = await getReceiptsFromDrive();
        return NextResponse.json({
          success: true,
          files: files,
          count: files.length
        });

      case 'info':
        // Get info for a specific file
        const fileId = searchParams.get('fileId');
        if (!fileId) {
          return NextResponse.json({ error: 'fileId parameter required' }, { status: 400 });
        }
        const fileInfo = await getFileInfo(fileId);
        return NextResponse.json({
          success: true,
          file: fileInfo
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Google Drive API error:', error);
    return NextResponse.json(
      { error: 'Failed to process Google Drive request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, fileId, fileName, mimeType } = await request.json();

    switch (action) {
      case 'process-all':
        // Process all receipts from Google Drive
        console.log('Starting batch processing of all receipts...');
        const results = await processAllReceiptsFromDrive();
        return NextResponse.json({
          success: true,
          message: `Processed ${results.length} files`,
          results: results
        });

      case 'process-file':
        // Process a specific file
        if (!fileId || !fileName || !mimeType) {
          return NextResponse.json({ 
            error: 'fileId, fileName, and mimeType required' 
          }, { status: 400 });
        }
        
        console.log(`Processing specific file: ${fileName}`);
        const result = await downloadAndProcessFile(fileId, fileName, mimeType);
        return NextResponse.json({
          success: true,
          message: `File ${fileName} processed successfully`,
          result: result
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Google Drive processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process Google Drive request' },
      { status: 500 }
    );
  }
}
