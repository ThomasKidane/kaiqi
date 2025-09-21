'use client';

import React, { useState } from 'react';
import { SimplePDFViewer } from './simple-pdf-viewer';
import { Button } from './button';
import { Eye, Download, X } from 'lucide-react';

interface DocumentViewerProps {
  fileName: string;
  fileType: string;
  fileUrl?: string;
  filePath?: string;
  className?: string;
}

export function DocumentViewer({ 
  fileName, 
  fileType, 
  fileUrl, 
  filePath, 
  className = '' 
}: DocumentViewerProps) {
  const [isViewing, setIsViewing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleView = () => {
    setIsViewing(true);
  };

  const handleClose = () => {
    setIsViewing(false);
    setIsFullscreen(false);
  };

  const handleDownload = () => {
    const url = fileUrl || filePath;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = fileType.startsWith('image/') || 
    fileName.toLowerCase().endsWith('.jpg') || 
    fileName.toLowerCase().endsWith('.jpeg') || 
    fileName.toLowerCase().endsWith('.png');

  const displayUrl = fileUrl || filePath;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
        <p className="text-xs text-gray-500">
          {isPDF ? 'PDF Document' : isImage ? 'Image' : 'Document'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        <Button
          onClick={handleView}
          variant="outline"
          size="sm"
          className="h-8 px-2"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="h-8 px-2"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Document Viewer Modal */}
      {isViewing && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 ${
          isFullscreen ? 'p-0' : 'p-4'
        }`}>
          <div className={`relative bg-white rounded-lg shadow-xl ${
            isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-[90vh] w-full'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">{fileName}</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="outline"
                  size="sm"
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className={`${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[70vh]'} overflow-auto`}>
              {isPDF && displayUrl ? (
                <div className="flex items-center justify-center h-full p-4">
                  <iframe
                    src={displayUrl}
                    className="w-full h-full border-0"
                    title={fileName}
                  />
                </div>
              ) : isImage && displayUrl ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={displayUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
