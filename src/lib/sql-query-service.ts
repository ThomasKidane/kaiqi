import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbAll, dbGet } from './database';

// Initialize Google AI client
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
let googleClient: GoogleGenerativeAI | null = null;

if (GOOGLE_AI_API_KEY) {
  googleClient = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
} else {
  console.warn('GOOGLE_AI_API_KEY not found in environment variables');
}

// Response format types
export type ResponseFormat = 'text' | 'table' | 'list';

export interface QueryResponse {
  format: ResponseFormat;
  data: any;
  message: string;
  sqlQuery?: string;
}

// Database schema for AI reference
const DATABASE_SCHEMA = `
Database Schema:
- documents table:
  - id (INTEGER PRIMARY KEY)
  - filename (TEXT) - name of the uploaded file
  - file_path (TEXT) - path to the file (local files: /path/to/file, Google Drive: drive://fileId)
  - vendor (TEXT) - company/vendor name
  - amount (REAL) - transaction amount
  - date (TEXT) - transaction date (YYYY-MM-DD format)
  - invoice_number (TEXT) - invoice/receipt number
  - status (TEXT) - document status
  - processed_at (DATETIME) - when document was processed

- document_items table:
  - id (INTEGER PRIMARY KEY)
  - document_id (INTEGER) - references documents.id
  - description (TEXT) - item description
  - amount (REAL) - item amount

Available SQLite functions: SUM(), COUNT(), AVG(), MAX(), MIN(), DATE(), STRFTIME()
Date format: YYYY-MM-DD

Special queries supported:
- "Process all receipts from Google Drive" - triggers Google Drive processing
- "Show me files from Google Drive" - shows Google Drive files
- "Sync Google Drive receipts" - processes all receipts from Google Drive folder
`;

// Generate SQL query using AI
async function generateSQLQuery(userQuery: string): Promise<{ sql: string; format: ResponseFormat }> {
  if (!googleClient) {
    throw new Error('Google AI client not initialized');
  }

  const model = googleClient.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a SQL query generator for a financial document database. 

${DATABASE_SCHEMA}

User Query: "${userQuery}"

Generate a SQL query and determine the appropriate response format. Consider the user's intent:

1. If they want a count, total, or single number → format: "text"
2. If they want to see multiple records in a structured way → format: "table" 
3. If they want a list of items → format: "list"

Rules:
- Only use SELECT statements (no INSERT, UPDATE, DELETE)
- Use proper SQLite syntax
- Include filename in SELECT when relevant
- Be careful with date comparisons (use proper date format)
- For month queries, use STRFTIME('%m', date) = '05' for May
- For year queries, use STRFTIME('%Y', date) = '2025'
- Always use parameterized queries for safety

Return your response as JSON:
{
  "sql": "SELECT ... FROM documents WHERE ...",
  "format": "text|table|list",
  "reasoning": "Brief explanation of why this format was chosen"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('=== AI SQL GENERATION ===');
    console.log('User query:', userQuery);
    console.log('AI response:', text);
    console.log('========================');

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      sql: parsed.sql,
      format: parsed.format || 'text'
    };

  } catch (error) {
    console.error('SQL generation error:', error);
    throw new Error(`Failed to generate SQL query: ${error.message}`);
  }
}

// Execute SQL query with retry logic
async function executeSQLQuery(sql: string, maxRetries: number = 10): Promise<any[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`=== SQL EXECUTION (Attempt ${attempt}) ===`);
      console.log('SQL Query:', sql);
      
      const result = await dbAll(sql);
      
      console.log('Query result:', result);
      console.log('========================');
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`SQL execution attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Try to fix common SQL issues
        const fixedSQL = await attemptSQLFix(sql, error as Error);
        if (fixedSQL && fixedSQL !== sql) {
          console.log('Attempting fixed SQL:', fixedSQL);
          sql = fixedSQL;
        }
      }
    }
  }

  throw new Error(`SQL query failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// Attempt to fix common SQL issues
async function attemptSQLFix(sql: string, error: Error): Promise<string | null> {
  if (!googleClient) return null;

  const model = googleClient.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `The following SQL query failed with error: "${error.message}"

SQL Query: ${sql}

${DATABASE_SCHEMA}

Please fix the SQL query. Return only the corrected SQL query, no explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const fixedSQL = response.text().trim();

    // Basic validation - ensure it's still a SELECT query
    if (fixedSQL.toLowerCase().startsWith('select')) {
      return fixedSQL;
    }
  } catch (fixError) {
    console.error('SQL fix attempt failed:', fixError);
  }

  return null;
}

// Format response based on type and data
function formatResponse(format: ResponseFormat, data: any[], userQuery: string): QueryResponse {
  switch (format) {
    case 'text':
      return {
        format: 'text',
        data: data,
        message: generateTextResponse(data, userQuery)
      };

    case 'table':
      return {
        format: 'table',
        data: data,
        message: `Found ${data.length} records matching your query.`
      };

    case 'list':
      return {
        format: 'list',
        data: data,
        message: `Here are ${data.length} items matching your query:`
      };

    default:
      return {
        format: 'text',
        data: data,
        message: 'Query executed successfully.'
      };
  }
}

// Generate human-readable text response
function generateTextResponse(data: any[], userQuery: string): string {
  if (data.length === 0) {
    return "No data found matching your query.";
  }

  // If it's a single row with aggregate data
  if (data.length === 1 && data[0]) {
    const row = data[0];
    
    // Check for SQLite aggregate function results
    const keys = Object.keys(row);
    const value = row[keys[0]];
    
    // Handle null values
    if (value === null || value === undefined) {
      return "0";
    }
    
    // Check if it's a numeric value
    if (typeof value === 'number') {
      // Check field name to determine formatting
      const fieldName = keys[0].toLowerCase();
      
      if (fieldName.includes('sum') || fieldName.includes('total')) {
        return `$${value.toFixed(2)}`;
      } else if (fieldName.includes('count')) {
        return value.toString();
      } else if (fieldName.includes('avg') || fieldName.includes('average')) {
        return `$${value.toFixed(2)}`;
      } else if (fieldName.includes('max') || fieldName.includes('min')) {
        return `$${value.toFixed(2)}`;
      } else {
        // Default formatting for numbers
        return value.toString();
      }
    }
    
    // For non-numeric values, return as string
    return value.toString();
  }

  // Default response
  return `Query returned ${data.length} result(s).`;
}

// Main function to process user queries
export async function processUserQuery(userQuery: string): Promise<QueryResponse> {
  try {
    console.log('=== PROCESSING USER QUERY ===');
    console.log('User query:', userQuery);
    console.log('=============================');

    // Check for Google Drive special queries
    const driveKeywords = ['google drive', 'drive', 'sync', 'process all receipts'];
    const isDriveQuery = driveKeywords.some(keyword => 
      userQuery.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isDriveQuery) {
      return await handleGoogleDriveQuery(userQuery);
    }

    // Generate SQL query
    const { sql, format } = await generateSQLQuery(userQuery);

    // Execute SQL query
    const data = await executeSQLQuery(sql);

    // Format response
    const response = formatResponse(format, data, userQuery);
    response.sqlQuery = sql;

    console.log('=== FINAL RESPONSE ===');
    console.log('Format:', response.format);
    console.log('Message:', response.message);
    console.log('Data length:', response.data.length);
    console.log('======================');

    return response;

  } catch (error) {
    console.error('Query processing error:', error);
    return {
      format: 'text',
      data: [],
      message: `Sorry, I couldn't process that query. ${error.message}`,
      sqlQuery: undefined
    };
  }
}

// Handle Google Drive specific queries
async function handleGoogleDriveQuery(userQuery: string): Promise<QueryResponse> {
  try {
    const query = userQuery.toLowerCase();
    
    if (query.includes('process all receipts') || query.includes('sync')) {
      // Process all receipts from Google Drive
      const { processAllReceiptsFromDrive } = await import('./google-drive-service');
      const results = await processAllReceiptsFromDrive();
      
      return {
        format: 'text',
        data: results,
        message: `Processed ${results.length} receipts from Google Drive`,
        sqlQuery: 'Google Drive Processing'
      };
    }
    
    if (query.includes('show me files') || query.includes('list files')) {
      // List files from Google Drive
      const { getReceiptsFromDrive } = await import('./google-drive-service');
      const files = await getReceiptsFromDrive();
      
      return {
        format: 'list',
        data: files.map(file => ({
          name: file.name,
          type: file.mimeType,
          size: file.size,
          modified: file.modifiedTime
        })),
        message: `Found ${files.length} files in your Google Drive receipts folder`,
        sqlQuery: 'Google Drive File Listing'
      };
    }
    
    // Default Google Drive response
    return {
      format: 'text',
      data: [],
      message: 'Google Drive integration is available. Try "Process all receipts from Google Drive" or "Show me files from Google Drive"',
      sqlQuery: undefined
    };
    
  } catch (error) {
    console.error('Google Drive query error:', error);
    return {
      format: 'text',
      data: [],
      message: `Google Drive error: ${error.message}. Please check your Google Drive configuration.`,
      sqlQuery: undefined
    };
  }
}

// Test function for the specific query
export async function testMayVolumeQuery(): Promise<void> {
  try {
    const result = await processUserQuery("What is the total volume of transaction for may");
    console.log('Test result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}
