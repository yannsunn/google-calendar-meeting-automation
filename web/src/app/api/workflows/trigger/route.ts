import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as n8nApi from '@/lib/n8n-api'

/**
 * POST /api/workflows/trigger
 * N8Nワークフローを手動でトリガーして提案資料を生成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // リクエストボディの取得
    const body = await request.json()
    const { meetingIds, workflowId } = body

    // バリデーション
    if (!meetingIds || !Array.isArray(meetingIds) || meetingIds.length === 0) {
      return NextResponse.json(
        { error: 'Meeting IDs are required' },
        { status: 400 }
      )
    }

    console.log('Triggering workflow for meetings', {
      meetingIds,
      workflowId,
      user: session.user?.email,
    })

    // Webhookパス（N8Nワークフロー内で定義されたWebhook）
    const webhookPath = 'trigger-proposal'

    // N8NワークフローをWebhook経由でトリガー
    const results = []
    const errors = []

    for (const meetingId of meetingIds) {
      try {
        console.log(`Triggering workflow via webhook for meeting ${meetingId}`)

        // Webhookをトリガー
        const result = await n8nApi.triggerWebhook(webhookPath, {
          meetingId,
          trigger: 'manual',
          triggeredBy: session.user?.email,
          timestamp: new Date().toISOString(),
        })

        results.push({
          meetingId,
          status: 'triggered',
          result,
        })

        console.log(`Workflow triggered successfully for meeting ${meetingId}`, result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to trigger workflow for meeting ${meetingId}`, errorMessage)

        errors.push({
          meetingId,
          error: errorMessage,
        })
      }
    }

    // 実行結果を返す
    const response = {
      success: errors.length === 0,
      triggered: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('Workflow trigger completed', response)

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200, // 207 Multi-Status
    })
  } catch (error) {
    console.error('Workflow trigger error', error)

    return NextResponse.json(
      {
        error: 'Failed to trigger workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workflows/trigger
 * 利用可能なワークフローの一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // N8Nからワークフロー一覧を取得
    const workflows = await n8nApi.getWorkflows()

    // 提案生成用のワークフローのみフィルタ
    const proposalWorkflows = workflows.filter((wf: any) =>
      wf.name.toLowerCase().includes('proposal') ||
      wf.name.toLowerCase().includes('ai') ||
      wf.name.toLowerCase().includes('agent')
    )

    return NextResponse.json({
      workflows: proposalWorkflows.map((wf: any) => ({
        id: wf.id,
        name: wf.name,
        active: wf.active,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch workflows', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch workflows',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}