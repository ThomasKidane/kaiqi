"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FolderOpen, CheckCircle, Database } from 'lucide-react';

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: React.ReactNode;
}

export const ProcessingAnimation: React.FC<{ 
  isVisible: boolean; 
  onComplete: () => void;
  uploadedCount: number;
}> = ({ isVisible, onComplete, uploadedCount }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [flyingDocuments, setFlyingDocuments] = useState<number[]>([]);

  const steps: ProcessingStep[] = [
    {
      id: 'scan',
      title: 'Scanning Documents',
      description: 'Extracting text and data from your files',
      status: 'pending',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'parse',
      title: 'Parsing Data',
      description: 'Identifying vendors, amounts, and dates',
      status: 'pending',
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 'organize',
      title: 'Organizing',
      description: 'Sorting documents into categories',
      status: 'pending',
      icon: <FolderOpen className="w-6 h-6" />
    },
    {
      id: 'complete',
      title: 'Ready for Analysis',
      description: 'Your documents are now searchable',
      status: 'pending',
      icon: <CheckCircle className="w-6 h-6" />
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    const processSteps = async () => {
      // Step 1: Scanning
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Parsing
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Organizing (flying documents animation)
      setCurrentStep(2);
      setFlyingDocuments(Array.from({ length: uploadedCount }, (_, i) => i));
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Step 4: Complete
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();
    };

    processSteps();
  }, [isVisible, uploadedCount, onComplete]);

  if (!isVisible) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 drop-shadow-lg">
              Processing Your Documents
            </h2>
            <p className="text-xl text-gray-300">
              AI is analyzing and organizing your financial data
            </p>
          </div>

          {/* Processing Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`
                  p-6 rounded-xl border transition-all duration-500
                  ${index <= currentStep 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-700 bg-gray-800/30'
                  }
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="text-center">
                  <motion.div
                    className={`
                      w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center
                      ${index <= currentStep ? 'text-primary' : 'text-gray-500'}
                    `}
                    animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {step.icon}
                  </motion.div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Flying Documents Animation */}
          <div className="relative h-64 overflow-hidden">
            {/* Folders */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-8">
              {['Invoices', 'Receipts', 'Statements'].map((folder, index) => (
                <motion.div
                  key={folder}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 + index * 0.2 }}
                >
                  <motion.div
                    className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-2"
                    animate={currentStep >= 2 ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <FolderOpen className="w-8 h-8 text-primary" />
                  </motion.div>
                  <p className="text-sm text-gray-400">{folder}</p>
                </motion.div>
              ))}
            </div>

            {/* Flying Documents */}
            <AnimatePresence>
              {flyingDocuments.map((docIndex) => (
                <motion.div
                  key={docIndex}
                  className="absolute top-8"
                  style={{
                    left: `${20 + (docIndex * 15)}%`,
                  }}
                  initial={{ opacity: 0, y: 0, rotate: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    y: [0, -100, -200, -300],
                    rotate: [0, 10, -10, 0],
                    x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 2,
                    delay: docIndex * 0.1,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-8 h-10 bg-white rounded-sm shadow-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="bg-gray-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-primary h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Status Message */}
          <motion.div
            className="text-center mt-8"
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg text-white font-medium">
              {steps[currentStep]?.title}
            </p>
            <p className="text-gray-400">
              {steps[currentStep]?.description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProcessingAnimation;
