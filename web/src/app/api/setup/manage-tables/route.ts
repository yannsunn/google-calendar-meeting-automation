import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント作成
function createSupabaseAdmin() {
  return createClient(
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
}

// テーブル削除（DELETE メソッド）
export async function DELETE(request: NextRequest) {
  try {
    const { tableName } = await request.json()

    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'Table name is required'
      }, { status: 400 })
    }

    // 危険な操作を防ぐ
    const protectedTables = ['_prisma_migrations', 'spatial_ref_sys']
    if (protectedTables.includes(tableName)) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete protected system tables'
      }, { status: 403 })
    }

    const supabase = createSupabaseAdmin()

    // SQLでテーブルを削除
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `DROP TABLE IF EXISTS public."${tableName}" CASCADE;`
    }).maybeSingle()

    if (error) {
      // RPCが存在しない場合の代替方法
      return NextResponse.json({
        success: false,
        error: 'Cannot delete table via API',
        details: error.message,
        manual_steps: [
          '1. Go to Supabase Dashboard',
          '2. Open SQL Editor',
          `3. Run: DROP TABLE IF EXISTS public."${tableName}" CASCADE;`,
          '4. Or use Table Editor to delete the table'
        ]
      })
    }

    return NextResponse.json({
      success: true,
      message: `Table ${tableName} deleted successfully`
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// calendar_eventsテーブル作成（POST メソッド）
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin()

    // まずテーブルが存在するか確認
    const { error: checkError } = await supabase
      .from('calendar_events')
      .select('count', { count: 'exact', head: true })

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Table calendar_events already exists',
        exists: true
      })
    }

    // テーブル作成のためのダミーデータ挿入
    const dummyEvent = {
      event_id: `init_${Date.now()}`,
      summary: 'Initialization Event',
      description: 'This event initializes the table',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
      location: '',
      meeting_url: '',
      attendees: [],
      raw_data: {},
      synced_at: new Date().toISOString()
    }

    // 挿入を試みる（これにより自動的にテーブルが作成される可能性がある）
    const { data: insertData, error: insertError } = await supabase
      .from('calendar_events')
      .insert([dummyEvent])
      .select()

    if (insertError) {
      // SQL Editorで実行するSQL
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

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_id ON public.calendar_events(event_id);`;

      return NextResponse.json({
        success: false,
        error: 'Cannot create table automatically',
        manual_steps: {
          method1: {
            title: 'Method 1: Using Table Editor',
            steps: [
              '1. Go to Table Editor in Supabase Dashboard',
              '2. Click "New table"',
              '3. Name: calendar_events',
              '4. Add columns as specified below'
            ]
          },
          method2: {
            title: 'Method 2: Using SQL Editor',
            steps: [
              '1. Go to SQL Editor in Supabase Dashboard',
              '2. Copy and paste the SQL below',
              '3. Click "Run"'
            ],
            sql: createTableSQL
          }
        }
      })
    }

    // ダミーデータを削除
    if (insertData && insertData.length > 0) {
      await supabase
        .from('calendar_events')
        .delete()
        .eq('event_id', dummyEvent.event_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Table calendar_events created successfully',
      created: true
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// テーブル一覧取得（GET メソッド）
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin()

    // 既知のテーブルをチェック
    const tables = [
      'calendar_events',
      'meetings',
      'attendees',
      'companies',
      'proposals',
      'workflow_executions'
    ]

    const tableStatus = []

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        tableStatus.push({
          name: tableName,
          exists: !error,
          recordCount: error ? 0 : (count || 0),
          error: error?.message
        })
      } catch (e) {
        tableStatus.push({
          name: tableName,
          exists: false,
          recordCount: 0,
          error: 'Table not found'
        })
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableStatus,
      summary: {
        total: tableStatus.length,
        existing: tableStatus.filter(t => t.exists).length,
        missing: tableStatus.filter(t => !t.exists).length
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}