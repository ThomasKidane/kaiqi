'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

// Dynamic import to avoid SSR issues
let Document: any, Page: any, pdfjs: any;

const loadPDFJS = async () => {
  if (typeof window !== 'undefined') {
    const pdfModule = await import('react-pdf');
    Document = pdfModule.Document;
    Page = pdfModule.Page;
    pdfjs = pdfModule.pdfjs;
    
    // Set up PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
};

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  className?: string;
}

export function PDFViewer({ fileUrl, fileName, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadPDFJS().then(() => {
      setPdfLoaded(true);
    });
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. The file may be corrupted or in an unsupported format.');
    setLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const downloadPDF = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  if (!pdfLoaded || loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">{!pdfLoaded ? 'Loading PDF viewer...' : 'Loading PDF...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <Button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={zoomOut} variant="outline" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button onClick={zoomIn} variant="outline" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex justify-center bg-gray-100 p-4">
        {Document && Page && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
