'use client';
import React, { useState } from 'react';
import { SimplePDFViewer } from './simple-pdf-viewer';
import { Eye, X, Download, Maximize2, Minimize2 } from 'lucide-react';

interface DocumentViewerProps {
  fileName: string;
  fileType: string;
  filePath?: string;
  fileUrl?: string;
  className?: string;
}

export function DocumentViewer({ 
  fileName, 
  fileType, 
  filePath, 
  fileUrl, 
  className = '' 
}: DocumentViewerProps) {
  const [isViewing, setIsViewing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const displayUrl = fileUrl || (filePath ? `/uploads/${filePath}` : `/uploads/${fileName}`);
  const isPDF = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isImage = fileType.includes('image') || 
    fileName.toLowerCase().endsWith('.jpg') || 
    fileName.toLowerCase().endsWith('.jpeg') || 
    fileName.toLowerCase().endsWith('.png');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = displayUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const closeViewer = () => {
    setIsViewing(false);
    setIsFullscreen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsViewing(true)}
        className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline ${className}`}
        title={`View ${fileName}`}
      >
        <Eye className="w-3 h-3" />
        {fileName}
      </button>

      {isViewing && (
        <div className={`fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center ${
          isFullscreen ? 'p-0' : 'p-4'
        }`}>
          <div className={`bg-white rounded-lg shadow-xl relative ${
            isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl h-full max-h-[90vh]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-800 truncate max-w-md">
                {fileName}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={closeViewer}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                  title="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
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
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">Unsupported file type</p>
                    <p className="text-sm">This file type cannot be previewed.</p>
                    <button
                      onClick={handleDownload}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

