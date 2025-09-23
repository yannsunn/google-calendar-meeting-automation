import { NextRequest, NextResponse } from 'next/server';
import { getWorkflows, executeWorkflow } from '@/lib/n8n-api';
import { mockWorkflows } from '@/lib/n8n-mock';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.N8N_API_KEY) {
      // APIキーが設定されていない場合はモックデータを返す
      console.warn('N8N_API_KEY not configured, returning mock data');
      return NextResponse.json(mockWorkflows);
    }

    const workflows = await getWorkflows();
    // ワークフローが配列でない場合は空配列を返す
    return NextResponse.json(Array.isArray(workflows) ? workflows : []);
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    // エラー時はモックデータを返す
    return NextResponse.json(mockWorkflows);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.N8N_API_KEY) {
      return NextResponse.json(
        { success: true, message: 'Mock execution triggered' }
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
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute workflow' }
    );
  }
}