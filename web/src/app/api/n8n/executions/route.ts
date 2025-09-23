import { NextRequest, NextResponse } from 'next/server';
import { getExecutions } from '@/lib/n8n-api';
import { mockExecutions } from '@/lib/n8n-mock';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.N8N_API_KEY) {
      // APIキーが設定されていない場合はモックデータを返す
      console.warn('N8N_API_KEY not configured, returning mock executions');
      return NextResponse.json(mockExecutions);
    }

    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');

    const executions = await getExecutions(workflowId || undefined);
    // 実行履歴が配列でない場合は空配列を返す
    return NextResponse.json(Array.isArray(executions) ? executions : []);
  } catch (error: any) {
    console.error('Error fetching executions:', error);
    // エラー時はモックデータを返す
    return NextResponse.json(mockExecutions);
  }
}