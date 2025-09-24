import { NextRequest, NextResponse } from 'next/server';
import { getExecutions } from '@/lib/n8n-api';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: 'N8N_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');

    const executions = await getExecutions(workflowId || undefined);
    return NextResponse.json(executions);
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}