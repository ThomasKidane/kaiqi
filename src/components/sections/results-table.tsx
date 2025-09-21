"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface QueryResult {
  query: string;
  data: Array<Record<string, any>>;
  summary: string;
}

interface ResultsTableProps {
  result: QueryResult | null;
  isVisible: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result, isVisible }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [displayedSummary, setDisplayedSummary] = useState('');

  useEffect(() => {
    if (result && isVisible) {
      setIsTyping(true);
      setDisplayedSummary('');
      
      // Simulate typing effect for summary
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex < result.summary.length) {
          setDisplayedSummary(result.summary.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 50);
      
      return () => clearInterval(typeInterval);
    }
  }, [result, isVisible]);

  if (!result || !isVisible) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'upcoming':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'upcoming':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-800/20 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 drop-shadow-lg">
              AI Analysis Results
            </h2>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-gray-400">Powered by AI</span>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 mb-8 border border-primary/20"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white">Summary</h3>
            </div>
            <p className="text-gray-300 text-lg">
              {displayedSummary}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </motion.div>

          {/* Query Context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <p className="text-gray-400 text-center">
              <span className="text-white font-medium">Query:</span> "{result.query}"
            </p>
          </motion.div>

          {/* Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {result.data.map((row, index) => {
                      // Map database fields to display fields
                      const vendor = row.vendor || 'Unknown Vendor';
                      const amount = row.amount || 0;
                      const date = row.date || new Date().toISOString().split('T')[0];
                      const status = row.status || 'processed';
                      
                      // Determine status based on date (overdue if older than 30 days)
                      const documentDate = new Date(date);
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const actualStatus = documentDate < thirtyDaysAgo ? 'overdue' : status;
                      
                      return (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-primary font-semibold text-sm">
                                  {vendor.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-white font-medium">{vendor}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold text-lg">
                              {formatCurrency(amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">
                              {formatDate(date)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`
                              inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium
                              ${getStatusColor(actualStatus)}
                            `}>
                              {getStatusIcon(actualStatus)}
                              <span className="capitalize">{actualStatus}</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Total Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {result.data.length}
              </div>
              <div className="text-gray-400">Total Records</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {formatCurrency(result.data.reduce((sum, item) => sum + (item.amount || 0), 0))}
              </div>
              <div className="text-gray-400">Total Amount</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-yellow-500 mb-2">
                {result.data.filter(item => {
                  const date = item.date || new Date().toISOString().split('T')[0];
                  const documentDate = new Date(date);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return documentDate < thirtyDaysAgo;
                }).length}
              </div>
              <div className="text-gray-400">Overdue Items</div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ResultsTable;
