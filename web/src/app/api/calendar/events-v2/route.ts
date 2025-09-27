import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json([])
    }

    // Supabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseKey)

    // パラメータの取得
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const days = parseInt(searchParams.get('days') || '7')

    // 日付範囲の計算
    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true })

    // 日付フィルタリング（オプション）
    if (startDate) {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(end.getDate() + days)

      query = query
        .gte('start_time', start.toISOString())
        .lt('start_time', end.toISOString())
    } else {
      // startDateが指定されていない場合は、今日から7日間のイベントを取得
      const now = new Date()
      const weekLater = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      query = query
        .gte('start_time', now.toISOString())
        .lt('start_time', weekLater.toISOString())
    }

    // データ取得
    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({
        error: true,
        message: error.message,
        code: error.code,
        details: error.details
      })
    }

    // データが取得できない場合のデバッグ
    if (!events || events.length === 0) {
      // すべてのイベントを取得してデバッグ
      const { data: allEvents, error: allError } = await supabase
        .from('calendar_events')
        .select('*')
        .limit(100)

      console.log('No events found in date range, total events in DB:', allEvents?.length || 0)
    }

    // meetingsテーブルの形式に変換
    const meetings = (events || []).map(event => ({
      id: event.id,
      google_event_id: event.event_id,
      title: event.summary || 'タイトルなし',
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || '',
      meeting_url: event.meeting_url || '',
      organizer_email: '',
      is_enabled: true,
      status: 'scheduled',
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      proposals: [],
      created_at: event.created_at || event.synced_at,
      updated_at: event.updated_at || event.synced_at
    }))

    console.log(`Returning ${meetings.length} events`)
    return NextResponse.json(meetings)

  } catch (error: any) {
    console.error('Unexpected error in calendar/events-v2:', error)
    return NextResponse.json({
      error: true,
      message: error.message || 'Unknown error',
      stack: error.stack
    })
  }
}