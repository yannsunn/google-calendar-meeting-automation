import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const results = {
    step1_auth: false,
    step2_fetch: false,
    step3_save: false,
    events: [],
    saveErrors: [],
    savedEvents: []
  }

  try {
    // Step 1: サービスアカウント認証
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim()
    if (!serviceAccountKey) {
      return NextResponse.json({ error: 'No service account key' })
    }

    const key = JSON.parse(serviceAccountKey)
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
      ]
    })

    results.step1_auth = true

    // Step 2: カレンダーイベントを取得
    const calendar = google.calendar({ version: 'v3', auth })
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: now.toISOString(),
      timeMax: weekLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 5 // デバッグ用に5件のみ
    })

    const events = response.data.items || []
    results.step2_fetch = true
    results.events = events.map(e => ({
      id: e.id,
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date
    }))

    // Step 3: Supabaseに保存
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    for (const event of events) {
      const eventData = {
        event_id: event.id!,
        summary: event.summary || 'タイトルなし',
        description: event.description || '',
        start_time: event.start?.dateTime || event.start?.date,
        end_time: event.end?.dateTime || event.end?.date,
        location: event.location || '',
        meeting_url: event.hangoutLink || '',
        attendees: event.attendees || [],
        raw_data: event,
        synced_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .upsert(eventData, { onConflict: 'event_id' })
        .select()

      if (error) {
        results.saveErrors.push({
          event_id: event.id,
          error: error.message
        })
      } else if (data) {
        results.savedEvents.push(data[0])
        results.step3_save = true
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        fetched: events.length,
        saved: results.savedEvents.length,
        errors: results.saveErrors.length
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    })
  }
}