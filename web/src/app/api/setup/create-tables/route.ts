import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // テーブル作成SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.calendar_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id TEXT UNIQUE NOT NULL,
        summary TEXT,
        description TEXT,
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        location TEXT,
        meeting_url TEXT,
        attendees JSONB DEFAULT '[]'::JSONB,
        raw_data JSONB,
        synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Supabase Management APIを使用する代わりに、テーブルが存在しない場合は空のテーブルを作成
    // 実際のテーブル作成はSupabaseダッシュボードで行う必要があります

    // テスト: テーブルの存在確認
    const { error: checkError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1)

    if (checkError && checkError.code === 'PGRST205') {
      return NextResponse.json({
        success: false,
        error: 'Table does not exist',
        message: 'Please create the table using Supabase dashboard',
        sql: createTableSQL,
        instructions: [
          '1. Go to Supabase Dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL above',
          '4. Click "Run" to create the table'
        ]
      })
    }

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: checkError.message
      })
    }

    // テーブルが存在する場合
    const { count } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Table already exists',
      recordCount: count || 0
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}