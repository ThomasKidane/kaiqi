import { getAllDocuments, getOutstandingBalances, getTotalAmount, searchDocuments, getDocumentsByVendor } from './database';
import { processQueryWithLLM } from './llm-service';
import { processIntelligentQuery } from './intelligent-query-processor';
import { createVisualization, ChartData } from './visualization-service';

// Tool definitions for the AI agent
export const tools = [
  {
    name: "get_all_documents",
    description: "Get all processed documents",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_outstanding_balances",
    description: "Get documents with outstanding balances (overdue payments)",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_total_amount",
    description: "Get the total amount across all documents",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "search_documents",
    description: "Search documents by vendor, invoice number, or filename",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_documents_by_vendor",
    description: "Get all documents for a specific vendor",
    parameters: {
      type: "object",
      properties: {
        vendor: {
          type: "string",
          description: "Vendor name to search for"
        }
      },
      required: ["vendor"]
    }
  },
  {
    name: "create_monthly_spending_chart",
    description: "Generate a line chart showing monthly spending trends",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "create_vendor_spending_chart",
    description: "Generate a bar chart showing top vendors by spending",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "create_spending_distribution_chart",
    description: "Generate a pie chart showing spending distribution by amount ranges",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "create_comprehensive_analysis",
    description: "Generate comprehensive spending analysis with multiple charts and summary statistics",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

// Tool execution functions
export async function executeTool(toolName: string, parameters: any) {
  switch (toolName) {
    case "get_all_documents":
      return await getAllDocuments();
    
    case "get_outstanding_balances":
      return await getOutstandingBalances();
    
    case "get_total_amount":
      return { total: await getTotalAmount() };
    
    case "search_documents":
      return await searchDocuments(parameters.query);
    
    case "get_documents_by_vendor":
      return await getDocumentsByVendor(parameters.vendor);
    
    case "create_monthly_spending_chart":
      return await createVisualization('monthly');
    
    case "create_vendor_spending_chart":
      return await createVisualization('vendor');
    
    case "create_spending_distribution_chart":
      return await createVisualization('distribution');
    
    case "create_comprehensive_analysis":
      return await createVisualization('all');
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Enhanced AI Agent that processes natural language queries using intelligent routing
export async function processQuery(query: string): Promise<{
  response: string;
  data?: any[];
  summary?: string;
  insights?: any[];
  recommendations?: any[];
}> {
  console.log('=== AI AGENT PROCESSING ===');
  console.log('User query:', query);
  
  try {
    // Use intelligent query processing
    const result = await processIntelligentQuery(query);
    
    console.log('Intelligent processing result:', result);
    
    // Generate additional insights using LLM if we have data
    let insights: any[] = [];
    let recommendations: any[] = [];
    
    if (result.data && result.data.length > 0) {
      try {
        const llmResult = await processQueryWithLLM(query, result.data);
        insights = llmResult.insights || [];
        recommendations = llmResult.recommendations || [];
      } catch (llmError) {
        console.log('LLM insights generation failed, continuing without insights:', llmError instanceof Error ? llmError.message : 'Unknown error');
      }
    }
    
    return {
      response: result.response,
      data: result.data,
      summary: result.response, // Use the response as summary
      insights,
      recommendations
    };
    
  } catch (error) {
    console.error('Query processing error:', error);
    
    // Generate more helpful error messages based on the error type
    let errorResponse = "I apologize, but I encountered an issue processing your request. ";
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      errorResponse += "There seems to be a database connectivity issue. Please try again in a moment, or contact support if the problem persists.";
    } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      errorResponse += "I don't have the necessary permissions to access that information. Please check your account settings or contact your administrator.";
    } else if (errorMessage.includes('format') || errorMessage.includes('parse')) {
      errorResponse += "I had trouble understanding your request format. Please try rephrasing your question in a different way.";
    } else if (errorMessage.includes('timeout') || errorMessage.includes('slow')) {
      errorResponse += "The request is taking longer than expected. Please try with a simpler query or check your internet connection.";
    } else if (errorMessage.includes('not found') || errorMessage.includes('missing')) {
      errorResponse += "I couldn't find the information you're looking for. This might be because no relevant data exists, or the search terms need to be adjusted.";
    } else {
      errorResponse += "Please try rephrasing your question or contact support if the issue continues. I'm here to help!";
    }
    
    return {
      response: errorResponse,
      data: [],
      summary: "Error occurred",
      insights: [],
      recommendations: []
    };
  }
}

// Note: All insight and recommendation generation has been moved to the LLM service
// The LLM provides more intelligent and context-aware analysis
