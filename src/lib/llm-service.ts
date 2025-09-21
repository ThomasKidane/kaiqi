import { GoogleGenerativeAI } from '@google/generative-ai';

// Google AI Configuration
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GOOGLE_AI_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

// Initialize Google AI client
let googleClient: GoogleGenerativeAI | null = null;

if (GOOGLE_AI_API_KEY) {
  googleClient = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
} else {
  console.warn('GOOGLE_AI_API_KEY not found in environment variables');
}

// Interface for extracted financial data
export interface ExtractedFinancialData {
  vendor: string;
  amount: number;
  date: string;
  invoice_number: string;
  items: Array<{ description: string; amount: number }>;
  insights: Array<{ type: string; message: string; severity: string }>;
  confidence_score: number;
  processed_at: string;
  status: string;
}

// Google AI-powered document analysis
export async function analyzeDocumentWithLLM(text: string, filePath?: string): Promise<ExtractedFinancialData> {
  console.log('Starting Google AI-powered document analysis...');
  
  // Check if this is a non-parseable PDF or image
  if (text.startsWith('PDF_NON_PARSEABLE:') || text.startsWith('IMAGE_NON_PARSEABLE:')) {
    return handleNonParseableDocument(text);
  }
  
  const prompt = createAnalysisPrompt(text);
  
  console.log('=== LLM PROMPT ===');
  console.log('Prompt sent to Gemini:');
  console.log(prompt);
  console.log('==================');
  
  try {
    if (!googleClient) {
      throw new Error('Google AI client not initialized. Please check your GOOGLE_AI_API_KEY.');
    }
    
    const response = await analyzeWithGoogle(prompt);
    
    console.log('=== LLM RESPONSE ===');
    console.log('Raw response from Gemini:');
    console.log(response);
    console.log('====================');
    
    // Parse the LLM response
    const extractedData = parseLLMResponse(response);
    
    console.log('=== PARSED RESULT ===');
    console.log('Final structured data:');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('====================');
    
    console.log('Google AI analysis completed successfully');
    return extractedData;
    
  } catch (error) {
    console.error('Google AI analysis error:', error);
    // Fallback to basic extraction if LLM fails
    return fallbackExtraction(text);
  }
}

// Handle non-parseable documents (PDFs or images)
function handleNonParseableDocument(text: string): ExtractedFinancialData {
  console.log('Handling non-parseable document...');
  
  const filename = text.split(':')[1];
  const type = text.startsWith('PDF_NON_PARSEABLE:') ? 'PDF' : 'Image';
  
  return {
    vendor: 'Non-parseable',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    invoice_number: 'N/A',
    items: [],
    insights: [{
      type: 'document_non_parseable',
      message: `${type} file "${filename}" could not be parsed. This may be due to image quality, formatting issues, or OCR limitations.`,
      severity: 'warning'
    }],
    confidence_score: 0,
    processed_at: new Date().toISOString(),
    status: 'non-parseable'
  };
}

// Create a comprehensive prompt for document analysis
function createAnalysisPrompt(text: string): string {
  return `You are a financial document analysis AI. Analyze the following document text and extract structured financial data.

Document Text:
"""
${text}
"""

Please extract the following information and return it as a JSON object:

{
  "vendor": "Company or vendor name (clean, properly formatted)",
  "amount": "Total amount as a number (0 if not found)",
  "date": "Document date in YYYY-MM-DD format",
  "invoice_number": "Invoice/receipt/bill number (N/A if not found)",
  "items": [
    {
      "description": "Item description",
      "amount": "Item amount as number"
    }
  ],
  "insights": [
    {
      "type": "insight_type",
      "message": "Description of the insight",
      "severity": "info|warning|error"
    }
  ],
  "confidence_score": "Confidence score 0-100 based on data quality"
}

Guidelines:
- Extract the vendor name from company headers, "Bill To", "Invoice To", etc.
- Find the total amount (look for "Total", "Amount Due", "Grand Total", etc.)
- Extract the document date (invoice date, due date, etc.)
- Find invoice/receipt/bill numbers
- Extract line items if available
- Generate insights about the document (high value, overdue, unusual patterns, etc.)
- Provide a confidence score based on how clearly the data was extracted
- If any field cannot be determined, use appropriate defaults (N/A, 0, current date)

Return only the JSON object, no additional text.`;
}

// Google AI analysis with rate limiting
async function analyzeWithGoogle(prompt: string): Promise<string> {
  if (!googleClient) {
    throw new Error('Google AI client not initialized');
  }
  
  const model = googleClient.getGenerativeModel({ 
    model: "gemini-2.5-flash" 
  });
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    // Check if it's a rate limit error
    if (error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('Too Many Requests') || 
         error.message.includes('quota'))) {
      
      console.log('Rate limit detected in LLM service, throwing error for retry logic');
      throw error;
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Parse LLM response into structured data
function parseLLMResponse(response: string): ExtractedFinancialData {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the parsed data
    return {
      vendor: parsed.vendor || 'Unknown Vendor',
      amount: parseFloat(parsed.amount) || 0,
      date: parsed.date || new Date().toISOString().split('T')[0],
      invoice_number: parsed.invoice_number || 'N/A',
      items: Array.isArray(parsed.items) ? parsed.items : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      confidence_score: Math.min(Math.max(parsed.confidence_score || 0, 0), 100),
      processed_at: new Date().toISOString(),
      status: 'processed'
    };
    
  } catch (error) {
    console.error('Failed to parse Google AI response:', error);
    throw new Error('Invalid Google AI response format');
  }
}

// Fallback extraction if Google AI fails
function fallbackExtraction(text: string): ExtractedFinancialData {
  console.log('Using fallback extraction...');
  
  // Basic regex patterns as fallback
  const vendorMatch = text.match(/(?:vendor|from|company|supplier)[\s:]*([a-zA-Z0-9\s&.,-]+)/i);
  const amountMatch = text.match(/\$?([0-9,]+\.?[0-9]*)/);
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  const invoiceMatch = text.match(/(?:invoice|inv|receipt|ref|bill)[\s#:]*([A-Z0-9\-]+)/i);
  
  return {
    vendor: vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor',
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
    invoice_number: invoiceMatch ? invoiceMatch[1] : 'N/A',
    items: [],
    insights: [{
      type: 'fallback',
      message: 'Used fallback extraction due to Google AI failure',
      severity: 'warning'
    }],
    confidence_score: 30,
    processed_at: new Date().toISOString(),
    status: 'processed'
  };
}

// Google AI-powered query processing
export async function processQueryWithLLM(query: string, data: any[]): Promise<{
  response: string;
  insights: any[];
  recommendations: any[];
}> {
  console.log('Processing query with Google AI...');
  
  const prompt = createQueryPrompt(query, data);
  
  try {
    if (!googleClient) {
      throw new Error('Google AI client not initialized. Please check your GOOGLE_AI_API_KEY.');
    }
    
    const response = await analyzeWithGoogle(prompt);
    
    return parseQueryResponse(response);
    
  } catch (error) {
    console.error('Google AI query processing error:', error);
    
    // Check if it's a rate limit error
    if (error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('Too Many Requests') || 
         error.message.includes('quota'))) {
      
      console.log('Rate limit hit in processQueryWithLLM, re-throwing for retry logic');
      throw error; // Re-throw for retry logic to handle
    }
    
    return {
      response: "I encountered an error while processing your request. Please try again.",
      insights: [],
      recommendations: []
    };
  }
}

// Create prompt for query processing
function createQueryPrompt(query: string, data: any[]): string {
  return `You are a financial AI assistant. Analyze the following financial data and respond to the user's query.

User Query: "${query}"

Financial Data:
${JSON.stringify(data, null, 2)}

Please provide:
1. A helpful response to the user's query
2. Relevant insights about the data
3. Actionable recommendations

Return your response as a JSON object:
{
  "response": "Your response to the user's query",
  "insights": [
    {
      "type": "insight_type",
      "message": "Description of the insight",
      "severity": "info|warning|error"
    }
  ],
  "recommendations": [
    {
      "type": "recommendation_type",
      "message": "Description of the recommendation",
      "priority": "high|medium|low"
    }
  ]
}

Be specific, helpful, and provide actionable insights based on the actual data.`;
}

// Parse query response
function parseQueryResponse(response: string): {
  response: string;
  insights: any[];
  recommendations: any[];
} {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      response: parsed.response || 'No response generated',
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    };
    
  } catch (error) {
    console.error('Failed to parse query response:', error);
    return {
      response: 'I analyzed your data but encountered an error formatting the response.',
      insights: [],
      recommendations: []
    };
  }
}