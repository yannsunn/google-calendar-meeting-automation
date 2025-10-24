import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const isPreview = body.preview_mode === true

    // プレビューモードの場合は、直接Gemini APIを呼び出す
    if (isPreview) {
      const geminiApiKey = process.env.GEMINI_API_KEY
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'GEMINI_API_KEY not configured' },
          { status: 500 }
        )
      }

      const prompt = `以下の企業について詳しく調査し、DX推進の提案を作成してください。

企業名: ${body.company_name}
提供URL: ${body.company_urls?.join(', ') || 'なし'}

以下の観点から具体的な提案を作成してください：

1. **業務効率化ツール**: 業界に最適なツールを具体的に提案
2. **ホームページ改善**: デザイン、機能、SEOの観点から
3. **チャットボット導入**: カスタマーサポートや営業支援
4. **AI活用提案**: 業務プロセスの自動化や分析

各提案には以下を含めてください：
- 導入メリット（3つ）
- 想定コスト（概算）
- 導入期間
- 具体的な製品・サービス名

わかりやすく、箇条書きで返してください。`

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      )

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      }

      const geminiData = await geminiResponse.json()
      const proposalText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

      return NextResponse.json({
        success: true,
        preview: true,
        company_name: body.company_name,
        proposal_content: proposalText,
        event_id: body.event_id
      })
    }

    // 通常モード: N8N Webhookを呼び出す
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
