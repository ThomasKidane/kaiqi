import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { parseDocument } from '@/lib/document-parser';
import { saveToDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log('Files received:', files.length);
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    console.log('Upload directory created:', uploadDir);

    const processedFiles = [];

    for (const file of files) {
      console.log('Processing file:', file.name, file.type);
      
      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(uploadDir, file.name);
      await writeFile(filePath, buffer);
      console.log('File saved to:', filePath);

      // Parse document
      console.log('Parsing document...');
      const parsedData = await parseDocument(filePath, file.type);
      console.log('Document parsed:', parsedData);
      
      // Save to database
      console.log('Saving to database...');
      const savedData = await saveToDatabase({ ...parsedData, filename: file.name });
      console.log('Data saved:', savedData);

      processedFiles.push({
        filename: file.name,
        type: file.type,
        size: file.size,
        parsedData: savedData
      });
    }

    console.log('All files processed successfully');
    return NextResponse.json({
      success: true,
      files: processedFiles,
      message: `Successfully processed ${files.length} file(s)`
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to process files', details: error.message },
      { status: 500 }
    );
  }
}
