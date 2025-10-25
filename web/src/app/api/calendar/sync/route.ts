import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Google Calendar OAuth2クライアントの作成
function getOAuth2Client() {
  // 現在、Google Calendar同期は無効化されています
  // 再有効化するには、新しいアクセストークンとリフレッシュトークンが必要です
  throw new Error('Google Calendar sync is currently disabled. Please re-authenticate to enable.')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const days = body.days || 7 // デフォルト7日間

    // Google Calendar APIクライアント
    const auth = getOAuth2Client()
    const calendar = google.calendar({ version: 'v3', auth: auth as any })

    // 日付範囲を設定
    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + days)

    console.log(`📅 Fetching calendar events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`)

    // カレンダーイベントを取得
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })

    const events = response.data.items || []
    console.log(`📊 Found ${events.length} events`)

    // データベースに保存
    if (process.env.DATABASE_URL) {
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        for (const event of events) {
          // ミーティングを保存/更新
          const meetingResult = await client.query(
            `INSERT INTO meetings (
              google_event_id,
              title,
              description,
              start_time,
              end_time,
              location,
              meeting_url,
              organizer_email,
              status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (google_event_id)
            DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              location = EXCLUDED.location,
              meeting_url = EXCLUDED.meeting_url,
              organizer_email = EXCLUDED.organizer_email,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id`,
            [
              event.id,
              event.summary || 'No Title',
              event.description || '',
              event.start?.dateTime || event.start?.date,
              event.end?.dateTime || event.end?.date,
              event.location || '',
              event.hangoutLink || '',
              event.organizer?.email || '',
              event.status || 'confirmed'
            ]
          )

          const meetingId = meetingResult.rows[0].id

          // 参加者を保存
          if (event.attendees) {
            for (const attendee of event.attendees) {
              await client.query(
                `INSERT INTO attendees (
                  meeting_id,
                  email,
                  name,
                  is_external,
                  is_organizer,
                  response_status
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (meeting_id, email)
                DO UPDATE SET
                  name = EXCLUDED.name,
                  response_status = EXCLUDED.response_status`,
                [
                  meetingId,
                  attendee.email,
                  attendee.displayName || attendee.email?.split('@')[0] || '',
                  !attendee.email?.includes('@' + (event.organizer?.email?.split('@')[1] || 'gmail.com')),
                  attendee.organizer || false,
                  attendee.responseStatus || 'needsAction'
                ]
              )
            }
          }
        }

        await client.query('COMMIT')
        console.log('✅ Successfully saved events to database')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    // Supabaseにも保存（オプション）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      for (const event of events) {
        await supabase
          .from('calendar_events')
          .upsert({
            event_id: event.id,
            summary: event.summary || 'No Title',
            description: event.description || '',
            start_time: event.start?.dateTime || event.start?.date,
            end_time: event.end?.dateTime || event.end?.date,
            location: event.location || '',
            meeting_url: event.hangoutLink || '',
            attendees: event.attendees || [],
            raw_data: event,
            synced_at: new Date().toISOString()
          }, { onConflict: 'event_id' })
      }

      console.log('✅ Successfully saved events to Supabase')
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${events.length} events`,
      eventsCount: events.length,
      events: events.map(e => ({
        id: e.id,
        title: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        attendees: e.attendees?.length || 0
      }))
    })

  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync calendar',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// 手動同期用のGETエンドポイント
export async function GET(request: NextRequest) {
  // POSTと同じ処理を実行
  return POST(request)
}