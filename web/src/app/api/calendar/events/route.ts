import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Supabaseクライアントを関数内で作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]
    const days = parseInt(searchParams.get('days') || '7')

    // 終了日を計算
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + days)

    // Supabaseからカレンダーイベントを取得
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', start.toISOString())
      .lt('start_time', end.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json([])
    }

    // meetingsテーブルの形式に変換
    const meetings = events?.map(event => ({
      id: event.id,
      google_event_id: event.event_id,
      title: event.summary,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      meeting_url: event.meeting_url,
      organizer_email: event.attendees?.[0]?.email || '',
      is_enabled: true,  // UIで必要
      status: 'scheduled',
      attendees: event.attendees || [],
      proposals: [],  // UIで必要
      created_at: event.synced_at,
      updated_at: event.synced_at
    })) || []

    return NextResponse.json(meetings)
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json([])
  }
}