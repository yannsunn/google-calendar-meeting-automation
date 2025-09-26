import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// トークンをリフレッシュする関数
async function getValidAccessToken() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  // リフレッシュトークンを使用
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  })

  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials.access_token
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw error
  }
}

// カレンダーイベントを取得して保存
export async function syncCalendarEvents() {
  try {
    // アクセストークンを取得（自動リフレッシュ）
    const accessToken = await getValidAccessToken()

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // 今後7日間のイベントを取得
    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    })

    const events = response.data.items || []

    // Supabaseに保存
    const savedEvents = []
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

      if (!error && data) {
        savedEvents.push(data[0])
      }
    }

    return {
      success: true,
      eventsCount: events.length,
      savedCount: savedEvents.length,
      lastSync: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Sync failed:', error)
    return {
      success: false,
      error: error.message,
      lastSync: new Date().toISOString()
    }
  }
}

// APIエンドポイント
export async function POST(request: NextRequest) {
  try {
    const result = await syncCalendarEvents()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET エンドポイント（手動実行用）
export async function GET(request: NextRequest) {
  return POST(request)
}