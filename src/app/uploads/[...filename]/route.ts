import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = join(process.cwd(), 'uploads', decodedFilename);
    
    // Check if file exists
    try {
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      if (decodedFilename.toLowerCase().endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else if (decodedFilename.toLowerCase().endsWith('.jpg') || decodedFilename.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (decodedFilename.toLowerCase().endsWith('.png')) {
        contentType = 'image/png';
      }
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${decodedFilename}"`,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (fileError) {
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
