import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// APIエンドポイント
export async function POST(request: NextRequest) {
  try {
    // セッションから認証情報を取得
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Google Calendar APIクライアントを作成
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

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
    console.log(`Fetched ${events.length} events from Google Calendar`)

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
        synced_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .upsert(eventData, { onConflict: 'event_id' })
        .select()

      if (!error && data) {
        savedEvents.push(data[0])
      } else if (error) {
        console.error('Error saving event:', error)
      }
    }

    return NextResponse.json({
      success: true,
      eventsCount: events.length,
      savedCount: savedEvents.length,
      lastSync: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
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