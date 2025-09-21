'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Download, ExternalLink } from 'lucide-react';

interface SimplePDFViewerProps {
  fileUrl: string;
  fileName: string;
  className?: string;
}

export function SimplePDFViewer({ fileUrl, fileName, className = '' }: SimplePDFViewerProps) {
  const [isViewing, setIsViewing] = useState(false);

  const handleView = () => {
    setIsViewing(true);
  };

  const handleClose = () => {
    setIsViewing(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
        <p className="text-xs text-gray-500">PDF Document</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        <Button
          onClick={handleView}
          variant="outline"
          size="sm"
          className="h-8 px-2"
        >
          <ExternalLink className="w-4 h-4" />
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

      {/* PDF Viewer Modal */}
      {isViewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">{fileName}</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleOpenInNewTab}
                  variant="outline"
                  size="sm"
                >
                  Open in New Tab
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="h-[70vh] overflow-auto">
              <div className="flex items-center justify-center h-full p-4">
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
