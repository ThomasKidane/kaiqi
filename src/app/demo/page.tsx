"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Paperclip, FileText, Image, File, Upload } from 'lucide-react';
import { Chart, ComprehensiveChart, ChartData } from '@/components/ui/chart';
import { DocumentViewer } from '@/components/ui/document-viewer';

interface ChatMessage {
  id: string;
  type: 'user' | 'kaiqi';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  format?: 'text' | 'table' | 'list' | 'chart' | 'comprehensive';
  data?: any[];
  sqlQuery?: string;
  attachments?: File[];
  chartData?: ChartData;
  comprehensiveData?: any;
}

interface QueryResult {
  query: string;
  data: Array<Record<string, any>>;
  summary: string;
  format?: 'text' | 'table' | 'list';
}

export default function DemoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('kaiqi-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('kaiqi-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (messages.length === 0) {
      // Generate session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'kaiqi',
        content: "Hi! I'm Kaiqi, your financial insights assistant. Ask me anything about your documents or attach files to get started. Try: 'What is the total volume of transaction for may' or 'Show me all vendors'",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const simulateTokenGeneration = () => {
    setIsGenerating(true);
    setGeneratedTokens(0);
    setTotalTokens(0);
    
    // Simulate token generation with random total
    const randomTotal = Math.floor(Math.random() * 200) + 50; // 50-250 tokens
    setTotalTokens(randomTotal);
    
    let currentTokens = 0;
    const interval = setInterval(() => {
      currentTokens += Math.floor(Math.random() * 5) + 1; // 1-5 tokens per update
      
      if (currentTokens >= randomTotal) {
        currentTokens = randomTotal;
        clearInterval(interval);
        setIsGenerating(false);
      }
      
      setGeneratedTokens(currentTokens);
    }, 100); // Update every 100ms
    
    return interval;
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim() || 'Processing attached files...',
      timestamp: new Date(),
      attachments: [...attachedFiles]
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Start token generation simulation
    const tokenInterval = simulateTokenGeneration();

    try {
      // If there are attached files, process them first
      if (attachedFiles.length > 0) {
        const formData = new FormData();
        attachedFiles.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }

        const uploadResult = await uploadResponse.json();
        console.log('Files uploaded:', uploadResult);
      }

      // Send query to AI agent
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputValue.trim() || 'Process the attached files and provide insights',
          sessionId: sessionId || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('AI query failed');
      }

      const result = await response.json();

      // Determine if this is a visualization response
      const isVisualizationResponse = result.data && result.data.length > 0 && 
        (result.data[0].type || (result.data[0].monthlyTrend && result.data[0].vendorBreakdown));
      
      const kaiqiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'kaiqi',
        content: result.response,
        timestamp: new Date(),
        format: isVisualizationResponse ? 
          (result.data && result.data[0] && result.data[0].monthlyTrend ? 'comprehensive' : 'chart') : 
          (result.format || 'text'),
        data: result.data || [],
        sqlQuery: result.sqlQuery,
        // Set chart data for single charts
        chartData: isVisualizationResponse && result.data && result.data[0] && result.data[0].type ? result.data[0] : undefined,
        // Set comprehensive data for multi-chart analysis
        comprehensiveData: isVisualizationResponse && result.data && result.data[0] && result.data[0].monthlyTrend ? result.data[0] : undefined
      };

      setMessages(prev => [...prev, kaiqiMessage]);
      setIsLoading(false);
      setIsGenerating(false);
      setAttachedFiles([]); // Clear attached files after processing

    } catch (error) {
      console.error('Chat error:', error);
      
      // Generate a more helpful error message based on the error type
      let errorContent = "I apologize, but I encountered an issue processing your request. ";
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        errorContent += "It seems there's a network connectivity issue. Please check your internet connection and try again.";
      } else if (errorMsg.includes('timeout')) {
        errorContent += "The request took too long to process. Please try again with a simpler query.";
      } else if (errorMsg.includes('file') || errorMsg.includes('upload')) {
        errorContent += "There was an issue processing your file. Please ensure the file is in a supported format (PDF, JPG, PNG, CSV) and try again.";
      } else {
        errorContent += "Please try rephrasing your question or contact support if the issue persists.";
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'kaiqi',
        content: errorContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <main className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${
      isDarkMode ? 'bg-gray-900' : 'bg-yellow-50'
    }`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
              : 'bg-yellow-500 hover:bg-yellow-600 text-black'
          }`}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Chat Container - Full Screen */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-3xl
                    ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}
                  `}>
                    <div className={`
                      px-4 py-3 max-w-full
                      ${message.type === 'user' 
                        ? isDarkMode 
                          ? 'text-yellow-400' 
                          : 'text-black'
                        : isDarkMode 
                          ? 'text-gray-200' 
                          : 'text-gray-800'
                      }
                    `}>
                      <p className="text-lg leading-relaxed font-medium">{message.content}</p>
                      
                      {/* Show attached files */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((file, index) => (
                            <div key={index} className={`flex items-center space-x-2 text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {getFileIcon(file)}
                              <span>{file.name}</span>
                              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                </div>
              ))}
            </div>
                      )}
                      
                      {/* Render data based on format */}
                      {message.data && message.data.length > 0 && message.data[0] && message.format && (
                        <div className="mt-3">
                          {message.format === 'table' && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                    {Object.keys(message.data[0]).map((key) => (
                                      <th key={key} className={`text-left p-2 font-semibold ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {key.replace(/_/g, ' ').toUpperCase()}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {message.data.slice(0, 5).map((row, index) => (
                                    <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                      {Object.entries(row).map(([key, value], cellIndex) => (
                                        <td key={cellIndex} className={`p-2 ${
                                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                        }`}>
                                          {key === 'Document Name' && typeof value === 'string' && (
                                            <DocumentViewer
                                              fileName={value}
                                              fileType={value.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
                                                       value.toLowerCase().endsWith('.jpg') || value.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 
                                                       value.toLowerCase().endsWith('.png') ? 'image/png' : 'application/octet-stream'}
                                              filePath={`/uploads/${value}`}
                                              className="text-xs"
                                            />
                                          )}
                                          {key !== 'Document Name' && (
                                            typeof value === 'number' && value.toString().includes('.') 
                                              ? `$${value.toFixed(2)}` 
                                              : String(value)
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {message.data.length > 5 && (
                                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ... and {message.data.length - 5} more records
                                </p>
                              )}
                            </div>
                          )}
                          
                          {message.format === 'list' && (
                            <div className="space-y-1">
                              {message.data.slice(0, 10).map((item, index) => (
                                <div key={index} className={`text-xs p-2 rounded border ${
                                  isDarkMode 
                                    ? 'bg-gray-800 border-gray-600' 
                                    : 'bg-white border-gray-200'
                                }`}>
                                  {item.vendor && <span className={`font-semibold ${
                                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>{item.vendor}</span>}
                                  {item.amount && typeof item.amount === 'number' && <span className="ml-2 text-green-500">${item.amount.toFixed(2)}</span>}
                                  {item.date && <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.date}</span>}
                                  {item.filename && <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>({item.filename})</span>}
          </div>
                              ))}
                              {message.data.length > 10 && (
                                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ... and {message.data.length - 10} more items
                                </p>
                              )}
        </div>
                          )}
                          
                          {/* Render chart visualization */}
                          {message.format === 'chart' && message.chartData && (
                            <div className="mt-4">
                              <Chart chartData={message.chartData} />
                            </div>
                          )}
                          
                          {/* Render comprehensive analysis */}
                          {message.format === 'comprehensive' && message.comprehensiveData && (
                            <div className="mt-4">
                              <ComprehensiveChart analysisData={message.comprehensiveData} />
                            </div>
                          )}
      </div>
                      )}
                      
                      {/* Render chart data from visualization responses */}
                      {message.data && message.data.length > 0 && message.data[0] && (
                        <div className="mt-3">
                          {/* Check if it's a single chart */}
                          {message.data[0].type && message.data[0].title && message.data[0].data && (
                            <div className="mt-4">
                              <Chart chartData={message.data[0]} />
                            </div>
                          )}
                          
                          {/* Check if it's comprehensive analysis */}
                          {message.data[0].monthlyTrend && message.data[0].vendorBreakdown && message.data[0].spendingDistribution && (
                            <div className="mt-4">
                              <ComprehensiveChart analysisData={message.data[0]} />
                            </div>
                          )}
                        </div>
                      )}
                      {message.sqlQuery && (
                        <details className="mt-2">
                          <summary className={`text-xs cursor-pointer ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-gray-300' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}>Show SQL Query</summary>
                          <code className={`text-xs p-2 rounded block mt-1 overflow-x-auto ${
                            isDarkMode 
                              ? 'bg-gray-800 text-gray-200' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {message.sqlQuery}
                          </code>
                        </details>
                      )}
                      
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
        </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
        <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className={`px-4 py-3 ${
                  isDarkMode 
                    ? 'text-gray-200' 
                    : 'text-gray-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                    <span className="text-lg font-medium">Kaiqi is analyzing...</span>
      </div>

                  {/* Token Generation Progress */}
                  {isGenerating && totalTokens > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Generating tokens: {generatedTokens}/{totalTokens}
                      </div>
                      <div className={`w-full rounded-full overflow-hidden ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-300 ease-out"
                          style={{ width: `${(generatedTokens / totalTokens) * 100}%` }}
                        />
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {Math.round((generatedTokens / totalTokens) * 100)}% complete
        </div>
      </div>
                  )}
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-transparent">
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className={`flex items-center space-x-2 px-3 py-1 rounded border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-white border-yellow-200'
                  }`}>
                    {getFileIcon(file)}
                    <span className={`text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className={`ml-1 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-300' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-lg border transition-colors flex items-center justify-center ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600' 
                    : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                }`}
                title="Attach files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
                onChange={handleFileAttach}
                className="hidden"
              />
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Kaiqi about your financial data... (e.g., 'What is the total volume of transaction for may')"
                className={`flex-1 px-6 py-4 rounded-lg border focus:border-yellow-500 focus:outline-none text-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-200 placeholder-gray-400 border-gray-600' 
                    : 'bg-white text-gray-800 placeholder-gray-500 border-gray-200'
                }`}
                disabled={isLoading}
              />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
                className={`px-8 py-3 rounded-lg transition-all font-medium flex items-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black' 
                    : 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-black'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Send</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
