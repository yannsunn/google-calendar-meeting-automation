import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_URL || 'https://n8n.srv946785.hstgr.cloud'
const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.srv946785.hstgr.cloud/webhook'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflow, meetings } = body

    // Trigger N8N webhook with meeting data
    const webhookUrl = `${N8N_WEBHOOK_BASE_URL}/${workflow}`

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetings,
        triggered_at: new Date().toISOString(),
        trigger_source: 'web_app'
      })
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Log workflow execution
    await logWorkflowExecution(workflow, 'triggered', { meetings: meetings.length })

    return NextResponse.json({
      success: true,
      message: 'Workflow triggered successfully',
      workflow,
      execution_id: result.execution_id
    })
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    )
  }
}

async function logWorkflowExecution(workflow: string, status: string, metadata: any) {
  // Log to database
  const { Pool } = await import('pg')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await pool.query(
      `INSERT INTO workflow_executions (workflow_name, trigger_type, status, input_data)
       VALUES ($1, $2, $3, $4)`,
      [workflow, 'manual', status, JSON.stringify(metadata)]
    )
  } catch (error) {
    console.error('Failed to log workflow execution:', error)
  } finally {
    await pool.end()
  }
}