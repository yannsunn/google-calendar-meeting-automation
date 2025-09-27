import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // 環境変数の存在確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
    }

    // Supabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseKey)

    // calendar_eventsテーブルから取得
    const { data: events, error, count } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch from Supabase',
        details: error.message,
        code: error.code
      })
    }

    return NextResponse.json({
      success: true,
      totalCount: count,
      eventsFound: events?.length || 0,
      sampleEvents: events || [],
      tableAccessed: 'calendar_events'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      message: error.message
    })
  }
}