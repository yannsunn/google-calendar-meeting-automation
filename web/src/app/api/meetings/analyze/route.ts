import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase クライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// 型定義
interface Meeting {
  id: string
  title: string
  description?: string
  start_time?: string
  end_time?: string
  location?: string
  attendees?: string[]
}

interface AnalysisResult {
  name: string
  industry: string
  description: string
  employees: string
  website: string
  strengths: string[]
  opportunities: string[]
  proposal: {
    title: string
    content: string
    keyPoints: string[]
  }
}

interface RequestBody {
  meetings: Meeting[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody
    const { meetings } = body

    if (!meetings || meetings.length === 0) {
      return NextResponse.json(
        { error: 'No meetings provided' },
        { status: 400 }
      )
    }

    // 会議タイトルから企業名を抽出
    const companyNames = meetings.map((m) => extractCompanyName(m.title))
    const filteredNames = companyNames.filter((name): name is string => Boolean(name))
    const uniqueCompanies = Array.from(new Set(filteredNames))

    if (uniqueCompanies.length === 0) {
      return NextResponse.json(
        { error: '企業名を特定できませんでした' },
        { status: 400 }
      )
    }

    // メインの企業名（最初の企業）
    const mainCompany = uniqueCompanies[0]

    // 企業情報を検索・分析（実際にはAPIやWebスクレイピングを使用）
    const analysis = await analyzeCompany(mainCompany, meetings[0])

    // 分析結果をデータベースに保存
    if (analysis) {
      await saveAnalysis(meetings[0].id, analysis)
    }

    return NextResponse.json({
      success: true,
      analysis,
      companies: uniqueCompanies
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: '分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 企業名を抽出
function extractCompanyName(title: string): string | null {
  // パターンマッチングで企業名を抽出
  const patterns = [
    /株式会社[\S]+/,
    /[\S]+株式会社/,
    /[\S]+役所/,
    /[\S]+グループ/,
    /[\S]+法人/,
    /[\S]+協会/,
    /[\S]+組合/
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      return match[0].replace(/[：:].+$/, '') // コロン以降を削除
    }
  }

  // 「さん」を含む場合は個人名の可能性
  if (title.includes('さん')) {
    const parts = title.split(/[\s　]/)
    return parts[0].replace('さん', '')
  }

  const firstPart = title.split(/[\s　]/)[0]
  return firstPart || null
}

// 企業分析（Gemini APIを使用）
async function analyzeCompany(companyName: string, meeting: Meeting): Promise<AnalysisResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    // APIキーがない場合はダミーデータを返す
    return generateDummyAnalysis(companyName, meeting)
  }

  try {
    const prompt = `
企業名: ${companyName}
会議タイトル: ${meeting.title}
会議内容: ${meeting.description || ''}

この企業について以下を分析してください：
1. 企業概要（業界、事業内容、規模など）
2. 強み・特徴（3つ）
3. 現在の課題・ニーズ（推測）
4. 提案内容：
   - 提案タイトル
   - 具体的な提案内容（200文字程度）
   - 重要ポイント（3つ）

JSON形式で回答してください：
{
  "name": "企業名",
  "industry": "業界",
  "description": "企業概要",
  "employees": "従業員数",
  "website": "ウェブサイト",
  "strengths": ["強み1", "強み2", "強み3"],
  "opportunities": ["機会1", "機会2"],
  "proposal": {
    "title": "提案タイトル",
    "content": "提案内容",
    "keyPoints": ["ポイント1", "ポイント2", "ポイント3"]
  }
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      }
    )

    const data = await response.json()

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AnalysisResult
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error)
  }

  // エラーの場合はダミーデータを返す
  return generateDummyAnalysis(companyName, meeting)
}

// ダミーの分析結果を生成
function generateDummyAnalysis(companyName: string, meeting: Meeting): AnalysisResult {
  const isGovernment = companyName.includes('役所') || companyName.includes('村')
  const isGroup = companyName.includes('グループ')

  if (isGovernment) {
    return {
      name: companyName,
      industry: '地方自治体',
      description: '地域住民の生活向上と地域発展を目指す地方自治体',
      employees: '100-500名',
      website: '',
      strengths: [
        '地域に根ざした公共サービスの提供',
        '住民との密接な関係性',
        'デジタル化推進への意欲'
      ],
      opportunities: [
        'DX推進による業務効率化',
        '住民サービスの向上'
      ],
      proposal: {
        title: 'デジタル化による行政サービス向上のご提案',
        content: '住民サービスの向上と職員の業務効率化を実現するDXソリューションをご提案します。オンライン申請システムの導入により、24時間365日の行政サービス提供が可能となり、住民の利便性が大幅に向上します。また、業務プロセスの自動化により、職員の作業時間を30%削減できます。',
        keyPoints: [
          'オンライン申請システムで住民の利便性向上',
          'RPA導入で定型業務を自動化',
          '段階的な導入で無理のない移行を実現'
        ]
      }
    }
  } else if (isGroup) {
    return {
      name: companyName,
      industry: 'サービス業',
      description: '複数の事業を展開するグループ企業',
      employees: '50-200名',
      website: '',
      strengths: [
        '多角的な事業展開',
        '豊富な顧客基盤',
        '柔軟な組織体制'
      ],
      opportunities: [
        'グループ間のシナジー創出',
        'デジタルマーケティングの強化'
      ],
      proposal: {
        title: 'グループ全体の業務効率化とシナジー創出のご提案',
        content: 'グループ各社の強みを活かしたクロスセルとデータ統合による経営効率化をご提案します。統合CRMシステムの導入により、グループ全体の顧客情報を一元管理し、各社の商材を相互に提案することで、売上を20%向上させることが可能です。',
        keyPoints: [
          '統合CRMで顧客情報を一元管理',
          'クロスセルで売上向上',
          'グループ間のナレッジ共有を促進'
        ]
      }
    }
  } else {
    return {
      name: companyName,
      industry: '不明',
      description: '詳細な企業情報は追加調査が必要です',
      employees: '不明',
      website: '',
      strengths: [
        '専門性の高いサービス提供',
        '顧客との信頼関係',
        '柔軟な対応力'
      ],
      opportunities: [
        'デジタル化による業務効率化',
        '新規顧客開拓'
      ],
      proposal: {
        title: 'ビジネス成長を加速するデジタルソリューション',
        content: '貴社のビジネス課題に合わせた最適なITソリューションをご提案します。業務プロセスの可視化と自動化により、生産性を向上させ、より付加価値の高い業務に集中できる環境を構築します。',
        keyPoints: [
          '業務プロセスの可視化と最適化',
          'ITツールによる自動化推進',
          '段階的な導入でリスクを最小化'
        ]
      }
    }
  }
}

// 分析結果を保存
async function saveAnalysis(meetingId: string, analysis: AnalysisResult): Promise<void> {
  try {
    // 企業情報を保存/更新
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        name: analysis.name,
        industry: analysis.industry,
        description: analysis.description,
        size: analysis.employees,
        website: analysis.website,
        research_data: {
          strengths: analysis.strengths,
          opportunities: analysis.opportunities,
          lastAnalyzed: new Date().toISOString()
        }
      }, {
        onConflict: 'name'
      })
      .select()
      .single()

    if (!companyError && company) {
      // 提案内容を保存
      await supabase
        .from('proposals')
        .insert({
          meeting_id: meetingId,
          company_id: company.id,
          title: analysis.proposal.title,
          content: analysis.proposal.content,
          key_points: { points: analysis.proposal.keyPoints },
          status: 'draft',
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Error saving analysis:', error)
  }
}