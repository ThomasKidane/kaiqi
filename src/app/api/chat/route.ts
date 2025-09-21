import { NextRequest, NextResponse } from 'next/server';
import { processQuery } from '@/lib/ai-agent';
import { processIntelligentQuery } from '@/lib/intelligent-query-processor';
import { createChatSession, saveChatMessage, getChatHistory } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    // Create or get session
    const currentSessionId = sessionId || `session_${Date.now()}`;
    createChatSession(currentSessionId);

    // Save user message
    saveChatMessage(currentSessionId, 'user', query);

    // Check if this is a file processing query
    const isFileProcessingQuery = query.toLowerCase().includes('process') && 
      (query.toLowerCase().includes('file') || query.toLowerCase().includes('attach'));

    let result;
    
    if (isFileProcessingQuery) {
      // Handle file processing queries with the original AI agent
      console.log('Processing file upload query...');
      result = await processQuery(query);
      
      // Save AI response
      saveChatMessage(currentSessionId, 'assistant', result.response);

      return NextResponse.json({
        success: true,
        response: result.response,
        data: result.data,
        summary: result.summary,
        format: 'text',
        sessionId: currentSessionId
      });
    } else {
      // Use intelligent query processing for all other queries
      console.log('Using intelligent query processing...');
      result = await processIntelligentQuery(query);
      
      // Save AI response
      saveChatMessage(currentSessionId, 'assistant', result.response);

      return NextResponse.json({
        success: true,
        response: result.response,
        data: result.data,
        format: result.format,
        analysis: result.analysis,
        sessionId: currentSessionId
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }

    const history = getChatHistory(sessionId);

    return NextResponse.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}
