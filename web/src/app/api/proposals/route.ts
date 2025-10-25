import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('event_id')

    let query: string
    let params: any[]

    if (eventId) {
      // 特定の会議の提案資料を取得
      query = `
        SELECT
          ce.event_id as id,
          ce.summary as title,
          ce.company_name,
          ce.start_time,
          ce.proposal_status,
          ce.company_urls,
          ce.synced_at,
          ce.description
        FROM calendar_events ce
        WHERE ce.event_id = $1
        ORDER BY ce.start_time DESC
      `
      params = [eventId]
    } else {
      // 全ての提案資料を取得
      query = `
        SELECT
          ce.event_id as id,
          ce.summary as title,
          ce.company_name,
          ce.start_time,
          ce.proposal_status,
          ce.company_urls,
          ce.synced_at
        FROM calendar_events ce
        WHERE ce.proposal_status IN ('generated', 'completed')
        ORDER BY ce.start_time DESC
        LIMIT 50
      `
      params = []
    }

    const result = await pool.query(query, params)

    return NextResponse.json({ proposals: result.rows })
  } catch (error: any) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals', details: error.message },
      { status: 500 }
    )
  }
}
