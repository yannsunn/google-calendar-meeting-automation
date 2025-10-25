import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Supabase credentials not configured')
      return NextResponse.json({ meetings: [] })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || searchParams.get('date') || new Date().toISOString().split('T')[0]
    const days = parseInt(searchParams.get('days') || '7')

    // 終了日を計算
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + days)

    // Supabase REST APIでデータ取得
    const response = await fetch(
      `${supabaseUrl}/rest/v1/calendar_events?start_time=gte.${start.toISOString()}&start_time=lt.${end.toISOString()}&order=start_time.asc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status}`)
    }

    const events = await response.json()

    // デバッグ: 取得したイベント数をログ出力
    logger.info(`Retrieved ${events.length} events from Supabase`, {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days: days
    })

    // フィールド名をフロントエンドに合わせて変換
    const meetings = events.map((event: any) => ({
      id: event.event_id,
      title: event.summary,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      meeting_url: event.meeting_url,
      organizer_email: event.organizer_email,
      company_name: event.company_name,
      attendees: event.attendees,
      external_attendees: event.external_attendees,
      has_external_attendees: event.has_external_attendees,
      external_count: event.external_count,
      duration_minutes: event.duration_minutes,
      is_important: event.is_important,
      status: event.status,
      proposal_status: event.proposal_status,
      company_urls: event.company_urls,
      synced_at: event.synced_at
    }))

    return NextResponse.json({ meetings })
  } catch (error: any) {
    logger.apiError({
      endpoint: '/api/meetings',
      method: 'GET',
      error: error
    })
    return NextResponse.json(
      { error: 'Failed to fetch meetings', details: error.message, meetings: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    const body = await request.json()

    // Supabase REST APIでデータ挿入
    const response = await fetch(
      `${supabaseUrl}/rest/v1/calendar_events`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Supabase API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      id: data[0]?.event_id,
      message: 'Event created successfully'
    })
  } catch (error: any) {
    logger.apiError({
      endpoint: '/api/meetings',
      method: 'POST',
      error: error
    })
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    )
  }
}
