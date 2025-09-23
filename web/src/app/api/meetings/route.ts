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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const query = `
      SELECT
        m.*,
        json_agg(DISTINCT jsonb_build_object(
          'email', a.email,
          'name', a.name,
          'company_id', a.company_id,
          'is_external', a.is_external
        )) FILTER (WHERE a.id IS NOT NULL) as attendees,
        json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'status', p.status,
          'presentation_url', p.presentation_url
        )) FILTER (WHERE p.id IS NOT NULL) as proposals
      FROM meetings m
      LEFT JOIN attendees a ON m.id = a.meeting_id
      LEFT JOIN proposals p ON m.id = p.meeting_id
      WHERE DATE(m.start_time) = $1
      GROUP BY m.id
      ORDER BY m.start_time ASC
    `

    const result = await pool.query(query, [date])

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching meetings:', error)
    // エラー時でも空配列を返すことでフロントエンドのエラーを防ぐ
    // ステータスコードは500を返してエラーであることを示す
    return NextResponse.json([], { status: 500 })
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
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}