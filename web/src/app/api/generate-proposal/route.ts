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

    // N8Nが空のレスポンスを返す場合があるため、テキストとして取得
    const responseText = await response.text()
    console.log('N8N response:', responseText)

    // レスポンスが空でない場合はJSONとしてパース
    let data = { success: true, message: 'Proposal generation started' }
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.log('Response is not JSON, using default success message')
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error calling N8N webhook:', error)
    return NextResponse.json(
      { error: 'Failed to generate proposal', details: error.message },
      { status: 500 }
    )
  }
}
