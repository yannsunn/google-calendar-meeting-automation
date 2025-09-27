import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: {
          schema: 'public'
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // まずテーブルの存在を確認
    const { error: checkError } = await supabase
      .from('calendar_events')
      .select('count', { count: 'exact', head: true })

    if (checkError && checkError.code === 'PGRST204') {
      // テーブルは存在するが空
      return NextResponse.json({
        success: true,
        message: 'Table exists but is empty',
        tableCreated: false,
        recordCount: 0
      })
    }

    if (checkError && checkError.code === 'PGRST205') {
      // テーブルが存在しない場合、ダミーデータを挿入してテーブルを自動作成
      const dummyEvent = {
        event_id: 'init_' + Date.now(),
        summary: 'System Initialization',
        description: 'This is a dummy event to initialize the table',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: 'System',
        meeting_url: '',
        attendees: [],
        raw_data: {},
        synced_at: new Date().toISOString()
      }

      // テーブルを作成するために挿入を試みる
      const { data: insertData, error: insertError } = await supabase
        .from('calendar_events')
        .insert([dummyEvent])
        .select()

      if (insertError) {
        // それでも失敗する場合は、Supabaseで直接作成が必要
        return NextResponse.json({
          success: false,
          error: 'Table does not exist and cannot be created automatically',
          details: insertError.message,
          solution: 'Please use Supabase dashboard to create the table manually',
          sql: `
CREATE TABLE public.calendar_events (
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
);`
        })
      }

      // ダミーデータを削除
      await supabase
        .from('calendar_events')
        .delete()
        .eq('event_id', dummyEvent.event_id)

      return NextResponse.json({
        success: true,
        message: 'Table created successfully',
        tableCreated: true,
        recordCount: 0
      })
    }

    // テーブルが存在する場合、レコード数を取得
    const { count } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Table already exists',
      tableCreated: false,
      recordCount: count || 0
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Unexpected error occurred'
    }, { status: 500 })
  }
}

// テーブル構造を確認するGETエンドポイント
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // テーブルからサンプルデータを取得
    const { data, error, count } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact' })
      .limit(5)
      .order('start_time', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          exists: false,
          message: 'Table does not exist',
          error: error.message
        })
      }
      return NextResponse.json({
        exists: false,
        error: error.message
      })
    }

    return NextResponse.json({
      exists: true,
      totalRecords: count || 0,
      sampleData: data || [],
      columns: data && data.length > 0 ? Object.keys(data[0]) : []
    })

  } catch (error: any) {
    return NextResponse.json({
      exists: false,
      error: error.message
    }, { status: 500 })
  }
}