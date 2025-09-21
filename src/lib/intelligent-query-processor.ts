import { processQueryWithLLM } from './llm-service';
import { getAllDocuments, getDocumentsByVendor, searchDocuments, dbRun } from './database';
import { parseDocument } from './document-parser';
import { createVisualization } from './visualization-service';
import { processUserQuery } from './sql-query-service';
import { join } from 'path';

// Financial domain knowledge and business logic
export const FINANCIAL_TERMS = {
  // Terms that mean "total amount of all transactions"
  TOTAL_AMOUNTS: [
    'outstanding charges', 'outstanding balance', 'total outstanding',
    'accounts payable', 'total payables', 'all charges',
    'total spending', 'total expenses', 'total costs',
    'sum of all', 'aggregate amount', 'total amount'
  ],
  
  // Terms that require document analysis for missing data
  REQUIRES_DOCUMENT_ANALYSIS: [
    'what was purchased', 'what did i buy', 'items bought',
    'what items', 'line items', 'purchase details',
    'where did i shop', 'location', 'address', 'store location',
    'merchant address', 'business address', 'shop location',
    'where was', 'where did', 'location of', 'address of',
    'where all', 'where are', 'where is', 'where can',
    'what was the total tax', 'tax amount', 'sales tax',
    'discount amount', 'promotion', 'coupon used',
    'payment method', 'how did i pay', 'card used',
    'receipt number', 'transaction id', 'reference number',
    'from where', 'transactions from', 'shopping from',
    'uber', 'lyft', 'ride', 'pickup', 'dropoff'
  ],
  
  // Terms that can be answered from database
  DATABASE_QUERIES: [
    'show me all', 'list all', 'find all', 'give me all',
    'all transactions', 'all documents', 'all receipts',
    'transactions from', 'receipts from', 'documents from',
    'how many transactions', 'count of', 'number of',
    'total by vendor', 'spending by', 'expenses by',
    'top vendor', 'biggest vendor', 'highest spending',
    'most spent', 'who is my top', 'which vendor',
    'spending analysis', 'vendor breakdown', 'vendor summary',
    'biggest spender', 'largest expense', 'top spending'
  ],
  
  // Terms that require visualization
  VISUALIZATION_QUERIES: [
    'chart', 'graph', 'visualization', 'trend', 'analysis',
    'monthly spending', 'spending trend', 'spending pattern',
    'vendor breakdown', 'spending distribution', 'pie chart',
    'bar chart', 'line chart', 'monthly analysis',
    'spending over time', 'expense trends', 'visual analysis',
    'distribution', 'breakdown', 'break down', 'show me spending',
    'spending by month', 'spending by vendor', 'top vendors',
    'spending categories', 'expense breakdown', 'financial summary',
    'comprehensive analysis', 'full analysis', 'complete analysis'
  ]
};

// Query analysis result
export interface QueryAnalysis {
  needsDocumentAnalysis: boolean;
  queryType: 'total_amount' | 'document_analysis' | 'database_query' | 'visualization' | 'mixed';
  extractedTerms: string[];
  suggestedAction: string;
  confidence: number;
}

// Analyze user query to determine processing strategy
export function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase();
  
  // Check for total amount queries
  const hasTotalAmountTerms = FINANCIAL_TERMS.TOTAL_AMOUNTS.some(term => 
    lowerQuery.includes(term)
  );
  
  // Check for document analysis requirements
  const needsDocumentAnalysis = FINANCIAL_TERMS.REQUIRES_DOCUMENT_ANALYSIS.some(term => 
    lowerQuery.includes(term)
  );
  
  // Check for database queries
  const isDatabaseQuery = FINANCIAL_TERMS.DATABASE_QUERIES.some(term => 
    lowerQuery.includes(term)
  );
  
  // Check for visualization queries
  const isVisualizationQuery = FINANCIAL_TERMS.VISUALIZATION_QUERIES.some(term => 
    lowerQuery.includes(term)
  );
  
  // Check for vendor queries (highest priority for database queries)
  const isVendorQuery = lowerQuery.includes('vendor') || lowerQuery.includes('from') || 
    lowerQuery.match(/(?:vendor|supplier|company|business|merchant|from|with)\s+([a-zA-Z\s&.,-]+)/i);
  
  // Check for specific vendor names that should trigger database queries
  const hasSpecificVendor = lowerQuery.includes('uber') || lowerQuery.includes('lyft') || 
    lowerQuery.includes('amazon') || lowerQuery.includes('starbucks') || lowerQuery.includes('mcdonalds');
  
  // Determine query type (prioritize database queries over document analysis)
  let queryType: QueryAnalysis['queryType'];
  let suggestedAction: string;
  let confidence = 0.8;
  
  if (isVisualizationQuery) {
    // Prioritize visualization queries - highest priority
    queryType = 'visualization';
    suggestedAction = 'Generate charts and visualizations for spending analysis';
    confidence = 0.98;
  } else if (isVendorQuery || hasSpecificVendor || (isDatabaseQuery && !needsDocumentAnalysis)) {
    // Prioritize vendor queries, specific vendors, and database queries over document analysis
    queryType = 'database_query';
    suggestedAction = 'Query database for existing structured data';
    confidence = 0.9;
  } else if (hasTotalAmountTerms && !needsDocumentAnalysis) {
    queryType = 'total_amount';
    suggestedAction = 'Calculate total amount from all documents in database';
    confidence = 0.9;
  } else if (needsDocumentAnalysis && !isDatabaseQuery) {
    // Only use document analysis for specific location/detail queries that aren't database queries
    queryType = 'document_analysis';
    suggestedAction = 'Analyze documents with LLM to extract missing information';
    confidence = 0.95;
  } else {
    // Default to database query for unknown queries (less aggressive)
    queryType = 'database_query';
    suggestedAction = 'Query database for existing structured data';
    confidence = 0.7;
  }
  
  // Extract relevant terms
  const extractedTerms: string[] = [];
  [...FINANCIAL_TERMS.TOTAL_AMOUNTS, ...FINANCIAL_TERMS.REQUIRES_DOCUMENT_ANALYSIS, ...FINANCIAL_TERMS.DATABASE_QUERIES, ...FINANCIAL_TERMS.VISUALIZATION_QUERIES]
    .forEach(term => {
      if (lowerQuery.includes(term)) {
        extractedTerms.push(term);
      }
    });
  
  return {
    needsDocumentAnalysis,
    queryType,
    extractedTerms,
    suggestedAction,
    confidence
  };
}

// Process query with intelligent routing
export async function processIntelligentQuery(query: string): Promise<{
  response: string;
  data?: any[];
  format: 'text' | 'table' | 'list';
  analysis?: QueryAnalysis;
}> {
  console.log('=== INTELLIGENT QUERY PROCESSING ===');
  console.log('User query:', query);
  
  const analysis = analyzeQuery(query);
  console.log('Query analysis:', analysis);
  
  try {
    if (analysis.queryType === 'total_amount') {
      return await handleTotalAmountQuery();
    } else if (analysis.queryType === 'visualization') {
      return await handleVisualizationQuery(query, analysis);
    } else if (analysis.queryType === 'document_analysis') {
      return await handleDocumentAnalysisQuery(query, analysis);
    } else if (analysis.queryType === 'database_query') {
      return await handleDatabaseQuery(query);
    } else {
      // Mixed approach - prioritize document analysis for better results
      console.log('Using mixed approach - prioritizing document analysis');
      return await handleDocumentAnalysisQuery(query, analysis);
    }
  } catch (error) {
    console.error('Intelligent query processing error:', error);
    return {
      response: `I encountered an issue processing your request: ${error.message}. Let me try a different approach.`,
      format: 'text',
      analysis
    };
  }
}

// Handle total amount queries
async function handleTotalAmountQuery(): Promise<{
  response: string;
  data: any[];
  format: 'text' | 'table' | 'list';
}> {
  console.log('Processing total amount query...');
  
  const documents = await getAllDocuments();
  const totalAmount = documents.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  
  if (totalAmount === 0) {
    return {
      response: "No outstanding charges found. You have no processed transactions.",
      data: [],
      format: 'text'
    };
  }
  
  return {
    response: `Your total outstanding charges amount to $${totalAmount.toLocaleString()}. This represents the sum of all processed transactions.`,
    data: [{ total_amount: totalAmount, transaction_count: documents.length }],
    format: 'text'
  };
}

// Helper function to add delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('Too Many Requests') || 
         error.message.includes('quota'));
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Rate limit hit, waiting ${Math.round(delayMs)}ms before retry ${attempt + 1}/${maxRetries}`);
        await delay(delayMs);
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Handle document analysis queries
async function handleDocumentAnalysisQuery(query: string, analysis: QueryAnalysis): Promise<{
  response: string;
  data: any[];
  format: 'text' | 'table' | 'list';
}> {
  console.log('Processing document analysis query...');
  
  // Get all documents to analyze
  const documents = await getAllDocuments();
  
  if (documents.length === 0) {
    return {
      response: "No documents available for analysis. Please upload some receipts first.",
      data: [],
      format: 'text'
    };
  }
  
  // Limit the number of documents to analyze to prevent rate limiting
  const maxDocuments = 5;
  const documentsToAnalyze = documents.slice(0, maxDocuments);
  
  if (documents.length > maxDocuments) {
    console.log(`Limiting analysis to ${maxDocuments} documents to prevent rate limiting`);
  }
  
  // Analyze each document with LLM for the specific query
  const analysisResults = [];
  
  for (let i = 0; i < documentsToAnalyze.length; i++) {
    const doc = documentsToAnalyze[i];
    
    try {
      console.log(`Analyzing document ${i + 1}/${documentsToAnalyze.length}: ${doc.filename}`);
      
      // Add delay between requests to be respectful to the API
      if (i > 0) {
        console.log('Taking a chill pill... waiting 2 seconds before next analysis');
        await delay(2000);
      }
      
      // Use cached extracted text if available, otherwise parse document
      let documentText = '';
      try {
        if (doc.extracted_text) {
          // Use cached extracted text - much faster!
          console.log(`Using cached text for: ${doc.filename}`);
          documentText = doc.extracted_text;
        } else if (doc.file_path.startsWith('drive://')) {
          // Skip Google Drive files for now - they need special handling
          console.log(`Skipping Google Drive file: ${doc.filename}`);
          continue;
        } else {
          console.log(`No cached text found, parsing document: ${doc.filename}`);
          // Fallback: parse document and cache the text
          const parsedData = await parseDocument(doc.file_path, 'application/pdf');
          documentText = parsedData.extracted_text || JSON.stringify(parsedData, null, 2);
          
          // Update database with extracted text for future use
          try {
            await dbRun('UPDATE documents SET extracted_text = ? WHERE id = ?', [documentText, doc.id]);
            console.log(`Cached extracted text for: ${doc.filename}`);
          } catch (updateError) {
            console.log(`Could not cache text for ${doc.filename}:`, updateError);
          }
        }
      } catch (parseError) {
        console.log(`Could not get text for ${doc.filename}, using existing data`);
        // Use existing document data as fallback
        documentText = `Vendor: ${doc.vendor}, Amount: ${doc.amount}, Date: ${doc.date}, Invoice: ${doc.invoice_number}`;
      }
      
      // Create a specific prompt for the query based on what's being asked
      let analysisPrompt = '';
      
      if (query.toLowerCase().includes('location') || query.toLowerCase().includes('where') || query.toLowerCase().includes('address')) {
        analysisPrompt = `Document: ${doc.filename}
        
Document Content: ${documentText}

Question: ${query}

IMPORTANT: You are specifically looking for LOCATION information. Extract any addresses, store locations, business addresses, or geographical information from this document. Look for:
- Street addresses
- Store names with locations
- Business addresses
- City/state information
- Any location identifiers

FORMATTING REQUIREMENTS:
- Use bullet points (*) for each location
- Put each location on a new line
- Use line breaks (\n) between different locations
- Keep responses concise and well-formatted

If you find location information, provide it clearly with proper formatting. If no location information is available, state "No location information found in this document."

Return your response focusing ONLY on location details with proper line breaks.`;
      } else if (query.toLowerCase().includes('purchase') || query.toLowerCase().includes('bought') || query.toLowerCase().includes('items')) {
        analysisPrompt = `Document: ${doc.filename}
        
Document Content: ${documentText}

Question: ${query}

IMPORTANT: You are specifically looking for PURCHASE/ITEM information. Extract any items purchased, products bought, or services received from this document. Look for:
- Item descriptions
- Product names
- Service details
- Line items
- Purchase details

FORMATTING REQUIREMENTS:
- Use bullet points (*) for each item
- Put each item on a new line
- Use line breaks (\n) between different items
- Keep responses concise and well-formatted

If you find purchase information, provide it clearly with proper formatting. If no purchase information is available, state "No purchase details found in this document."

Return your response focusing ONLY on purchase/item details with proper line breaks.`;
      } else {
        analysisPrompt = `Document: ${doc.filename}
        
Document Content: ${documentText}

Question: ${query}

Please analyze this document and extract the specific information requested. Focus on the question asked and provide relevant details. If the information is not available in this document, clearly state that.

FORMATTING REQUIREMENTS:
- Use bullet points (*) for each item
- Put each item on a new line
- Use line breaks (\n) between different items
- Keep responses concise and well-formatted

Return your response in a clear, structured format with proper line breaks.`;
      }
      
      // Use retry logic with exponential backoff for LLM calls
      const result = await retryWithBackoff(async () => {
        return await processQueryWithLLM(analysisPrompt, []);
      }, 3, 2000);
      
      if (result && result.response && !result.response.includes('not available')) {
        analysisResults.push({
          filename: doc.filename,
          vendor: doc.vendor,
          amount: doc.amount,
          date: doc.date,
          analysis_result: result.response
        });
      }
      
      console.log(`Successfully analyzed document: ${doc.filename}`);
      
    } catch (error) {
      console.error(`Error analyzing document ${doc.filename}:`, error);
      
      // If it's a rate limit error, add extra delay before continuing
      if (error instanceof Error && error.message.includes('429')) {
        console.log('Rate limit detected, taking extra long chill pill... waiting 10 seconds');
        await delay(10000);
      }
    }
  }
  
  if (analysisResults.length === 0) {
    return {
      response: "I couldn't find the requested information in your documents. The documents may not contain the specific details you're looking for, or I may have hit rate limits while analyzing them.",
      data: [],
      format: 'text'
    };
  }
  
  const totalAnalyzed = analysisResults.length;
  const totalAvailable = documents.length;
  
  // For location queries, format the response to show actual locations
  if (query.toLowerCase().includes('location') || query.toLowerCase().includes('where') || query.toLowerCase().includes('address')) {
    const locationSummary = analysisResults
      .filter(result => result.analysis_result && !result.analysis_result.includes('No location information'))
      .map(result => `**${result.filename}**: ${result.analysis_result}`)
      .join('\n\n');
    
    return {
      response: `I found location information in ${analysisResults.length} document(s):\n\n${locationSummary}`,
      data: analysisResults,
      format: 'text'
    };
  }
  
  // For purchase/item queries, format the response to show actual items
  if (query.toLowerCase().includes('purchase') || query.toLowerCase().includes('bought') || query.toLowerCase().includes('items')) {
    const purchaseSummary = analysisResults
      .filter(result => result.analysis_result && !result.analysis_result.includes('No purchase details'))
      .map(result => `**${result.filename}**: ${result.analysis_result}`)
      .join('\n\n');
    
    return {
      response: `I found purchase information in ${analysisResults.length} document(s):\n\n${purchaseSummary}`,
      data: analysisResults,
      format: 'text'
    };
  }
  
  // Default response for other queries
  return {
    response: `I analyzed ${totalAnalyzed} document(s) and found the requested information. ${totalAvailable > maxDocuments ? `(Limited to ${maxDocuments} documents to prevent rate limiting)` : ''}`,
    data: analysisResults,
    format: 'list'
  };
}

// Handle database queries
async function handleDatabaseQuery(query: string): Promise<{
  response: string;
  data: any[];
  format: 'text' | 'table' | 'list';
}> {
  console.log('Processing database query...');
  
  const lowerQuery = query.toLowerCase();
  
  // Check if user is referring to a recently uploaded document
  if (lowerQuery.includes('this transaction') || lowerQuery.includes('this document') ||
      lowerQuery.includes('this receipt') || lowerQuery.includes('this file') ||
      lowerQuery.includes('tell me about this') || lowerQuery.includes('what is this') ||
      lowerQuery.includes('analyze this') || lowerQuery.includes('explain this')) {
    
    // Get the most recently uploaded document
    const allDocs = await getAllDocuments();
    if (allDocs.length === 0) {
      return {
        response: "No documents found. Please upload a document first.",
        data: [],
        format: 'text'
      };
    }
    
    // Get the most recent document (assuming it's the one just uploaded)
    const recentDoc = allDocs[allDocs.length - 1];
    
    // Try to get fresh text content from the document
    let documentText = recentDoc.extracted_text || '';
    
    // If no extracted text, try to get it from the file
    if (!documentText || documentText.trim().length < 10) {
      try {
        const { parseDocument } = await import('./document-parser');
        const filePath = join(process.cwd(), 'uploads', recentDoc.filename);
        const parsedData = await parseDocument(filePath, recentDoc.filename.includes('.pdf') ? 'application/pdf' : 'image/jpeg');
        documentText = parsedData.extracted_text || '';
      } catch (parseError) {
        console.log('Could not re-parse document:', parseError);
      }
    }
    
    // Analyze the specific document
    const analysisPrompt = `Document: ${recentDoc.filename}
    
Document Content: ${documentText || 'No text content available'}

Question: ${query}

Please analyze this specific document and provide detailed information about this transaction. Focus on:
- Transaction details (amount, date, vendor)
- Items purchased or services received
- Location information
- Payment method
- Any other relevant details

Provide a comprehensive analysis of this specific transaction.`;

    try {
      const result = await processQueryWithLLM(analysisPrompt, []);
      
      if (result && result.response) {
        return {
          response: `**Analysis of ${recentDoc.filename}:**\n\n${result.response}`,
          data: [{
            'Document Name': recentDoc.filename,
            'Vendor': recentDoc.vendor || 'Unknown',
            'Amount': recentDoc.amount ? `$${recentDoc.amount.toFixed(2)}` : 'N/A',
            'Date': recentDoc.date || 'Unknown',
            'Invoice #': recentDoc.invoice_number || 'N/A',
            'Type': recentDoc.filename?.includes('.pdf') ? 'PDF' : recentDoc.filename?.includes('.jpeg') || recentDoc.filename?.includes('.jpg') ? 'Image' : 'Other'
          }],
          format: 'text'
        };
      }
    } catch (error) {
      console.error('Error analyzing recent document:', error);
    }
    
    // Fallback to basic document info
    return {
      response: `**Document Information:**\n\n**${recentDoc.filename}**\n• Vendor: ${recentDoc.vendor || 'Unknown'}\n• Amount: ${recentDoc.amount ? `$${recentDoc.amount.toFixed(2)}` : 'N/A'}\n• Date: ${recentDoc.date || 'Unknown'}\n• Invoice #: ${recentDoc.invoice_number || 'N/A'}`,
      data: [{
        'Document Name': recentDoc.filename,
        'Vendor': recentDoc.vendor || 'Unknown',
        'Amount': recentDoc.amount ? `$${recentDoc.amount.toFixed(2)}` : 'N/A',
        'Date': recentDoc.date || 'Unknown',
        'Invoice #': recentDoc.invoice_number || 'N/A',
        'Type': recentDoc.filename?.includes('.pdf') ? 'PDF' : recentDoc.filename?.includes('.jpeg') || recentDoc.filename?.includes('.jpg') ? 'Image' : 'Other'
      }],
      format: 'text'
    };
  }
  
  // Check for analytical queries that should use SQL insights
  if (lowerQuery.includes('top vendor') || lowerQuery.includes('biggest vendor') || 
      lowerQuery.includes('highest spending') || lowerQuery.includes('most spent') ||
      lowerQuery.includes('who is my top') || lowerQuery.includes('which vendor') ||
      lowerQuery.includes('biggest spender') || lowerQuery.includes('largest expense') ||
      lowerQuery.includes('top spending') || lowerQuery.includes('who do i spend') ||
      lowerQuery.includes('most money') || lowerQuery.includes('highest amount')) {
    
    try {
      // Use SQL query service for better SQL generation
      const sqlResult = await processUserQuery(query);
      return {
        response: sqlResult.message,
        data: sqlResult.data,
        format: sqlResult.format
      };
    } catch (error) {
      console.error('SQL query service error:', error);
      // Fallback to manual calculation
      const allDocs = await getAllDocuments();
      if (allDocs.length === 0) {
        return {
          response: "No documents found. Upload some documents to get spending insights.",
          data: [],
          format: 'text'
        };
      }
      
      // Calculate vendor spending using SQL-like logic
      const vendorSpending = allDocs.reduce((acc, doc) => {
        const vendor = doc.vendor || 'Unknown';
        if (!acc[vendor]) {
          acc[vendor] = { total: 0, count: 0, transactions: [] };
        }
        acc[vendor].total += doc.amount || 0;
        acc[vendor].count += 1;
        acc[vendor].transactions.push(doc);
        return acc;
      }, {} as Record<string, { total: number; count: number; transactions: any[] }>);
      
      // Find top vendor by spending
      const topVendor = Object.entries(vendorSpending)
        .sort(([,a], [,b]) => b.total - a.total)[0];
      
      const [vendorName, vendorData] = topVendor;
      
      return {
        response: `**Top Vendor Analysis:**\n\n🏆 **${vendorName}** is your top vendor:\n• Total Spending: $${vendorData.total.toFixed(2)}\n• Transaction Count: ${vendorData.count}\n• Average Transaction: $${(vendorData.total / vendorData.count).toFixed(2)}`,
        data: [],
        format: 'text'
      };
    }
  }
  
  // Check for spending analysis queries
  if (lowerQuery.includes('spending analysis') || lowerQuery.includes('vendor breakdown') ||
      lowerQuery.includes('spending by vendor') || lowerQuery.includes('vendor summary')) {
    
    const allDocs = await getAllDocuments();
    if (allDocs.length === 0) {
      return {
        response: "No documents found. Upload some documents to get spending analysis.",
        data: [],
        format: 'text'
      };
    }
    
    // Calculate vendor spending breakdown
    const vendorSpending = allDocs.reduce((acc, doc) => {
      const vendor = doc.vendor || 'Unknown';
      if (!acc[vendor]) {
        acc[vendor] = { total: 0, count: 0 };
      }
      acc[vendor].total += doc.amount || 0;
      acc[vendor].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    // Sort vendors by spending
    const sortedVendors = Object.entries(vendorSpending)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 10); // Top 10 vendors
    
    const totalSpending = allDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    
    const vendorBreakdown = sortedVendors.map(([vendor, data], index) => {
      const percentage = ((data.total / totalSpending) * 100).toFixed(1);
      return {
        'Rank': index + 1,
        'Vendor': vendor,
        'Total Spending': `$${data.total.toFixed(2)}`,
        'Transactions': data.count,
        'Percentage': `${percentage}%`,
        'Average': `$${(data.total / data.count).toFixed(2)}`
      };
    });
    
    return {
      response: `**Vendor Spending Analysis:**\n\nTotal Spending: $${totalSpending.toFixed(2)}\nTotal Transactions: ${allDocs.length}\n\n**Top Vendors by Spending:**`,
      data: vendorBreakdown,
      format: 'table'
    };
  }
  
  // Extract vendor name if mentioned
  const vendorMatch = query.match(/(?:vendor|supplier|company|business|merchant|from|with)\s+([a-zA-Z\s&.,-]+)/i);
  
  if (vendorMatch) {
    const vendorName = vendorMatch[1].trim();
    
    try {
      // Use SQL query service for better vendor queries
      const sqlResult = await processUserQuery(query);
      return {
        response: sqlResult.message,
        data: sqlResult.data,
        format: sqlResult.format
      };
    } catch (error) {
      console.error('SQL query service error for vendor query:', error);
      // Fallback to manual vendor lookup
      const vendorDocs = await getDocumentsByVendor(vendorName);
      
      if (vendorDocs.length === 0) {
        return {
          response: `No documents found for vendor "${vendorName}". Try checking the spelling or upload documents from this vendor.`,
          data: [],
          format: 'text'
        };
      }
      
      const totalAmount = vendorDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
      
      // Format vendor documents for table display
      const formattedVendorDocs = vendorDocs.map(doc => ({
        'Document Name': doc.filename || 'Unknown',
        'Amount': doc.amount ? `$${doc.amount.toFixed(2)}` : 'N/A',
        'Date': doc.date || 'Unknown',
        'Invoice #': doc.invoice_number || 'N/A',
        'Type': doc.filename?.includes('.pdf') ? 'PDF' : doc.filename?.includes('.jpeg') || doc.filename?.includes('.jpg') ? 'Image' : 'Other'
      }));
      
      return {
        response: `**Documents from ${vendorName} (${vendorDocs.length} transactions, $${totalAmount.toFixed(2)} total):**`,
        data: formattedVendorDocs,
        format: 'table'
      };
    }
  }
  
  // Check for specific list queries that should use SQL
  if (lowerQuery.includes('show me all vendors') || lowerQuery.includes('list all vendors') ||
      lowerQuery.includes('show me all transactions') || lowerQuery.includes('list all transactions') ||
      lowerQuery.includes('show me all documents') || lowerQuery.includes('list all documents')) {
    
    try {
      // Use SQL query service for better list queries
      const sqlResult = await processUserQuery(query);
      return {
        response: sqlResult.message,
        data: sqlResult.data,
        format: sqlResult.format
      };
    } catch (error) {
      console.error('SQL query service error for list query:', error);
      // Fallback to manual handling
    }
  }
  
  // Check for search terms (only for specific search queries)
  const searchMatch = query.match(/(?:search|find|look)\s+(?:for\s+)?([a-zA-Z0-9\s&.,-]+)/i);
  
  if (searchMatch) {
    const searchTerm = searchMatch[1].trim();
    const searchResults = await searchDocuments(searchTerm);
    
    if (searchResults.length === 0) {
      return {
        response: `No documents found matching "${searchTerm}". Try a different search term or upload more documents.`,
        data: [],
        format: 'text'
      };
    }
    
    // Format search results for table display
    const formattedSearchResults = searchResults.map(doc => ({
      'Document Name': doc.filename || 'Unknown',
      'Vendor': doc.vendor || 'Unknown',
      'Amount': doc.amount ? `$${doc.amount.toFixed(2)}` : 'N/A',
      'Date': doc.date || 'Unknown',
      'Invoice #': doc.invoice_number || 'N/A',
      'Type': doc.filename?.includes('.pdf') ? 'PDF' : doc.filename?.includes('.jpeg') || doc.filename?.includes('.jpg') ? 'Image' : 'Other'
    }));
    
    return {
      response: `**Search Results for "${searchTerm}" (${searchResults.length} matches):**`,
      data: formattedSearchResults,
      format: 'table'
    };
  }
  
  // Default: return all documents
  const allDocs = await getAllDocuments();
  
  if (allDocs.length === 0) {
    return {
      response: "No documents have been processed yet. Upload some documents to get started with analysis.",
      data: [],
      format: 'text'
    };
  }
  
  const totalAmount = allDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  
  // Format documents for table display with better column names
  const formattedDocs = allDocs.map(doc => ({
    'Document Name': doc.filename || 'Unknown',
    'Vendor': doc.vendor || 'Unknown',
    'Amount': doc.amount ? `$${doc.amount.toFixed(2)}` : 'N/A',
    'Date': doc.date || 'Unknown',
    'Invoice #': doc.invoice_number || 'N/A',
    'Type': doc.filename?.includes('.pdf') ? 'PDF' : doc.filename?.includes('.jpeg') || doc.filename?.includes('.jpg') ? 'Image' : 'Other'
  }));
  
  return {
    response: `**All Documents (${allDocs.length} total):**`,
    data: formattedDocs,
    format: 'table'
  };
}

// Handle visualization queries
async function handleVisualizationQuery(query: string, analysis: QueryAnalysis): Promise<{
  response: string;
  data: any[];
  format: 'text' | 'table' | 'list';
}> {
  console.log('Processing visualization query...');
  
  try {
    const lowerQuery = query.toLowerCase();
    
    // Determine which visualization to create based on query
    let chartType: 'monthly' | 'vendor' | 'distribution' | 'all';
    
    if (lowerQuery.includes('monthly') || lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
      chartType = 'monthly';
    } else if (lowerQuery.includes('vendor') || lowerQuery.includes('breakdown')) {
      chartType = 'vendor';
    } else if (lowerQuery.includes('distribution') || lowerQuery.includes('pie')) {
      chartType = 'distribution';
    } else {
      chartType = 'all'; // Comprehensive analysis
    }
    
    console.log(`Creating ${chartType} visualization...`);
    const visualization = await createVisualization(chartType);
    
    if (chartType === 'all') {
      // Comprehensive analysis returns multiple charts
      return {
        response: `I've generated a comprehensive spending analysis with multiple visualizations. Here's your spending summary in a structured format:`,
        data: [visualization],
        format: 'comprehensive'
      };
    } else {
      // Single chart
      const chartDescriptions = {
        monthly: 'monthly spending trend',
        vendor: 'vendor spending breakdown',
        distribution: 'spending distribution by amount ranges'
      };
      
      return {
        response: `Here's your ${chartDescriptions[chartType]} visualization:`,
        data: [visualization],
        format: 'chart'
      };
    }
    
  } catch (error) {
    console.error('Visualization query error:', error);
    return {
      response: `I encountered an issue generating the visualization: ${error.message}. Please try again or ask for a different type of analysis.`,
      data: [],
      format: 'text'
    };
  }
}
