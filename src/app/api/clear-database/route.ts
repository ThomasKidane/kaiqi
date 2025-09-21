import { NextRequest, NextResponse } from 'next/server';
import { clearAllData } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Clearing all database data...');
    const result = await clearAllData();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'All data cleared successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to clear database'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json(
      { error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}
