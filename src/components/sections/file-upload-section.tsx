"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, FileSpreadsheet, X, CheckCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export const FileUploadSection: React.FC<{ 
  onFilesProcessed?: (count: number) => void;
}> = ({ onFilesProcessed }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      // Upload files to backend
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update file statuses
      setUploadedFiles(prev => 
        prev.map(f => ({ ...f, status: 'completed' }))
      );

      // Trigger processing animation
      setTimeout(() => {
        setIsProcessing(true);
        onFilesProcessed?.(files.length);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => 
        prev.map(f => ({ ...f, status: 'error' }))
      );
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('image')) return <Image className="w-5 h-5" />;
    if (type.includes('csv') || type.includes('excel') || type.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 drop-shadow-lg">
              Upload Your Documents
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Drag and drop your invoices, receipts, and financial documents
            </p>
          </div>

          {/* Upload Area */}
          <motion.div
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
              ${isDragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-600 hover:border-primary/50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />

            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-gray-400 mb-4">
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary/80 underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, PNG, JPG, CSV, Excel files
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Uploaded Files */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
                <div className="grid gap-4">
                  {uploadedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between border border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-primary">
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Status Indicator */}
                        <div className="flex items-center space-x-2">
                          {file.status === 'uploading' && (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          )}
                          {file.status === 'processing' && (
                            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                          )}
                          {file.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          <span className="text-sm text-gray-400 capitalize">
                            {file.status}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Process Button */}
          {uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'completed') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg"
                onClick={() => setIsProcessing(true)}
              >
                Process Documents
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FileUploadSection;
