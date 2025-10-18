import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: NextRequest) {
  try {
    // DATABASE_URLが設定されていない場合は空配列を返す
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL is not configured')
      return NextResponse.json([])
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || searchParams.get('date') || new Date().toISOString().split('T')[0]
    const days = parseInt(searchParams.get('days') || '7') // デフォルトは7日間

    // 終了日を計算
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + days)

    const query = `
      SELECT
        event_id as id,
        summary as title,
        description,
        start_time,
        end_time,
        location,
        meeting_url,
        organizer_email,
        company_name,
        attendees,
        external_attendees,
        has_external_attendees,
        external_count,
        duration_minutes,
        is_important,
        status,
        proposal_status,
        company_urls,
        synced_at
      FROM calendar_events
      WHERE start_time >= $1 AND start_time < $2
      ORDER BY start_time ASC
    `

    const result = await pool.query(query, [start.toISOString(), end.toISOString()])

    return NextResponse.json({ meetings: result.rows })
  } catch (error: any) {
    console.error('Error fetching meetings:', error)

    // データベース接続エラーの場合は明示的に伝える
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Database connection failed', meetings: [] },
        { status: 503 }
      )
    }

    // その他のエラー
    return NextResponse.json(
      { error: 'Failed to fetch meetings', details: error.message, meetings: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      google_event_id,
      title,
      description,
      start_time,
      end_time,
      location,
      meeting_url,
      organizer_email,
      attendees = []
    } = body

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const meetingResult = await client.query(
        `INSERT INTO meetings (
          google_event_id, title, description, start_time, end_time,
          location, meeting_url, organizer_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (google_event_id)
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          location = EXCLUDED.location,
          meeting_url = EXCLUDED.meeting_url,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id`,
        [google_event_id, title, description, start_time, end_time, location, meeting_url, organizer_email]
      )

      const meetingId = meetingResult.rows[0].id

      for (const attendee of attendees) {
        await client.query(
          `INSERT INTO attendees (meeting_id, email, name, is_external, is_organizer)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (meeting_id, email) DO NOTHING`,
          [meetingId, attendee.email, attendee.name, attendee.is_external || false, attendee.is_organizer || false]
        )
      }

      await client.query('COMMIT')

      return NextResponse.json({ id: meetingId, message: 'Meeting created successfully' })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting', details: error.message },
      { status: 500 }
    )
  }
}