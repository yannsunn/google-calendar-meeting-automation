import { NextRequest, NextResponse } from 'next/server';
import { getWorkflows, executeWorkflow } from '@/lib/n8n-api';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: 'N8N_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const workflows = await getWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: 'N8N_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { workflowId, data } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    const result = await executeWorkflow(workflowId, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}