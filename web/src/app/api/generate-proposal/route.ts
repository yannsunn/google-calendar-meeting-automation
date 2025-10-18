import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // N8N Webhookを呼び出す
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || 'https://n8n.srv946785.hstgr.cloud'
    const response = await fetch(`${n8nUrl}/webhook/generate-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N webhook error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate proposal', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error calling N8N webhook:', error)
    return NextResponse.json(
      { error: 'Failed to generate proposal', details: error.message },
      { status: 500 }
    )
  }
}
