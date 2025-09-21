"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  format?: 'text' | 'table' | 'list';
  data?: any[];
  sqlQuery?: string;
}

interface QueryResult {
  query: string;
  data: Array<Record<string, any>>;
  summary: string;
  format?: 'text' | 'table' | 'list';
}

export const AIChatInterface: React.FC<{ 
  isVisible: boolean;
  onQueryResult: (result: QueryResult) => void;
}> = ({ isVisible, onQueryResult }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isVisible && messages.length === 0) {
      // Generate session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'ai',
        content: "Hi! I'm your AI financial assistant. Ask me anything about your documents. You can ask questions like 'What is the total volume of transaction for may', 'Show me all Uber transactions', or 'How many transactions do I have'. I'll answer and show results right here!",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send query to AI agent
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputValue.trim(),
          sessionId: sessionId || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('AI query failed');
      }

      const result = await response.json();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.response,
        timestamp: new Date(),
        format: result.format || 'text',
        data: result.data,
        sqlQuery: result.sqlQuery
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // If response includes data, trigger result display
      if (result.data && result.data.length > 0) {
        onQueryResult({
          query: inputValue.trim(),
          data: result.data,
          summary: result.response,
          format: result.format || 'text'
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 drop-shadow-lg">
              Ask Your AI Assistant
            </h2>
            <p className="text-xl text-gray-300">
              Get instant insights from your financial documents
            </p>
          </div>

          {/* Chat Container */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
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
                      flex items-start space-x-3 max-w-xs lg:max-w-md
                      ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}
                    `}>
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gray-700 text-white'
                        }
                      `}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      
                      <div className={`
                        px-4 py-3 rounded-2xl
                        ${message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gray-700 text-white'
                        }
                      `}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        
                        {/* Render data based on format */}
                        {message.data && message.data.length > 0 && message.format && (
                          <div className="mt-3">
                            {message.format === 'table' && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-gray-600">
                                      {Object.keys(message.data[0]).map((key) => (
                                        <th key={key} className="text-left p-2 font-semibold">
                                          {key.replace(/_/g, ' ').toUpperCase()}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {message.data.slice(0, 5).map((row, index) => (
                                      <tr key={index} className="border-b border-gray-600">
                                        {Object.values(row).map((value, cellIndex) => (
                                          <td key={cellIndex} className="p-2">
                                            {typeof value === 'number' && value.toString().includes('.') 
                                              ? `$${value.toFixed(2)}` 
                                              : String(value)
                                            }
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {message.data.length > 5 && (
                                  <p className="text-xs mt-2 opacity-70">
                                    ... and {message.data.length - 5} more records
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {message.format === 'list' && (
                              <div className="space-y-1">
                                {message.data.slice(0, 10).map((item, index) => (
                                  <div key={index} className="text-xs bg-gray-600/50 p-2 rounded">
                                    {item.vendor && <span className="font-semibold">{item.vendor}</span>}
                                    {item.amount && <span className="ml-2">${item.amount.toFixed(2)}</span>}
                                    {item.date && <span className="ml-2 text-gray-400">{item.date}</span>}
                                    {item.filename && <span className="ml-2 text-gray-400 text-xs">({item.filename})</span>}
                                  </div>
                                ))}
                                {message.data.length > 10 && (
                                  <p className="text-xs mt-2 opacity-70">
                                    ... and {message.data.length - 10} more items
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Show SQL query for debugging */}
                        {message.sqlQuery && (
                          <details className="mt-2">
                            <summary className="text-xs opacity-70 cursor-pointer">Show SQL Query</summary>
                            <code className="text-xs bg-gray-800 p-2 rounded block mt-1 overflow-x-auto">
                              {message.sqlQuery}
                            </code>
                          </details>
                        )}
                        
                        <p className={`
                          text-xs mt-1 opacity-70
                          ${message.type === 'user' ? 'text-primary-foreground' : 'text-gray-400'}
                        `}>
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
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-700 text-white px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is analyzing...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your finances... (e.g., 'Show outstanding balances')"
                  className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-xl border border-gray-600 focus:border-primary focus:outline-none"
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-primary-foreground px-6 py-3 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Example Queries */}
          <div className="mt-8">
            <p className="text-gray-400 text-center mb-4">Try these example queries:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "What is the total volume of transaction for may",
                "Show me all Uber transactions",
                "How many transactions do I have after March 1st",
                "What's my total expenses this month?"
              ].map((example) => (
                <motion.button
                  key={example}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setInputValue(example)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {example}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIChatInterface;
