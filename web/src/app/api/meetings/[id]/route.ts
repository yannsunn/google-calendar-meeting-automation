import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
          'presentation_url', p.presentation_url,
          'content', p.content
        )) FILTER (WHERE p.id IS NOT NULL) as proposals
      FROM meetings m
      LEFT JOIN attendees a ON m.id = a.meeting_id
      LEFT JOIN proposals p ON m.id = p.meeting_id
      WHERE m.id = $1
      GROUP BY m.id
    `

    const result = await pool.query(query, [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_enabled } = body

    const result = await pool.query(
      'UPDATE meetings SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_enabled, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      'DELETE FROM meetings WHERE id = $1 RETURNING id',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Meeting deleted successfully' })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}