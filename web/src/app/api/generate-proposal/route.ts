import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const isPreview = body.preview_mode === true
    const generateSlides = body.generate_slides === true

    // プレビューモードまたはスライド生成モードの場合は、直接処理
    if (isPreview || generateSlides) {
      const geminiApiKey = process.env.GEMINI_API_KEY
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'GEMINI_API_KEY not configured' },
          { status: 500 }
        )
      }

      // スライド生成の場合は、JSON形式で返すようにプロンプトを変更
      const prompt = generateSlides ?
        `以下の企業についてDX推進の提案プレゼンテーションを作成してください。

企業名: ${body.company_name}
提供URL: ${body.company_urls?.join(', ') || 'なし'}

以下のJSON形式でスライドデータを返してください：
{
  "slides": [
    {
      "type": "title",
      "title": "${body.company_name} 様\\nDX推進提案資料",
      "date": "${new Date().toLocaleDateString('ja-JP')}"
    },
    {
      "type": "agenda",
      "title": "アジェンダ",
      "sections": [
        {"heading": "現状分析", "content": ["現在の課題", "業界動向"]},
        {"heading": "提案内容", "content": ["業務効率化", "顧客体験向上", "データ活用"]}
      ]
    },
    {
      "type": "content",
      "title": "業務効率化ツールの導入",
      "sections": [
        {"heading": "提案ツール", "content": ["具体的なツール名とその特徴"]},
        {"heading": "導入メリット", "content": ["メリット1", "メリット2", "メリット3"]},
        {"heading": "導入コスト", "content": ["初期費用: XX万円", "月額: XX円"]}
      ]
    }
  ]
}

必ず有効なJSONとして返してください。` :
        `以下の企業について詳しく調査し、DX推進の提案を作成してください。

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

      // スライド生成モードの場合
      if (generateSlides) {
        try {
          // GeminiのレスポンスからJSONを抽出
          let slideData
          try {
            // JSONブロックを抽出（```json ... ``` または直接JSON）
            const jsonMatch = proposalText.match(/```json\s*([\s\S]*?)\s*```/) ||
                            proposalText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const jsonStr = jsonMatch[1] || jsonMatch[0]
              const parsed = JSON.parse(jsonStr)
              slideData = parsed.slides || parsed
            } else {
              throw new Error('No valid JSON found in response')
            }
          } catch (e) {
            console.error('Failed to parse Gemini response as JSON:', e)
            // フォールバックとして基本的なスライドデータを生成
            slideData = [
              {
                type: 'title',
                title: `${body.company_name} 様\nDX推進提案資料`,
                date: new Date().toLocaleDateString('ja-JP')
              },
              {
                type: 'content',
                title: '提案内容',
                sections: [{
                  heading: 'DX推進提案',
                  content: proposalText.split('\n').filter(line => line.trim())
                }]
              },
              {
                type: 'closing',
                title: 'ご清聴ありがとうございました'
              }
            ]
          }

          // Google Apps Scriptに送信
          const gasUrl = process.env.GAS_SLIDE_GENERATOR_URL ||
                        'https://script.google.com/macros/s/AKfycbzN-YourScriptId/exec'

          const gasResponse = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              slideData: slideData,
              companyName: body.company_name,
              presentationTitle: `${body.company_name} 様 DX推進提案`
            })
          })

          if (!gasResponse.ok) {
            throw new Error(`GAS error: ${gasResponse.status}`)
          }

          const gasData = await gasResponse.json()

          return NextResponse.json({
            success: true,
            generate_slides: true,
            company_name: body.company_name,
            slide_url: gasData.slideUrl,
            slide_count: gasData.slideCount,
            presentation_id: gasData.presentationId,
            event_id: body.event_id
          })
        } catch (error: any) {
          console.error('Error generating slides:', error)
          return NextResponse.json(
            { error: 'Failed to generate slides', details: error.message },
            { status: 500 }
          )
        }
      }

      // プレビューモード
      return NextResponse.json({
        success: true,
        preview: true,
        company_name: body.company_name,
        proposal_content: proposalText,
        event_id: body.event_id
      })
    }

    // N8Nは使用しないため、エラーを返す
    return NextResponse.json(
      { error: 'N8N integration has been removed. Please use preview_mode or generate_slides options.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error calling N8N webhook:', error)
    return NextResponse.json(
      { error: 'Failed to generate proposal', details: error.message },
      { status: 500 }
    )
  }
}
