import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // プロジェクトIDを取得
    const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]

    // Supabase Management API エンドポイント
    const apiUrl = `${SUPABASE_URL}/rest/v1/rpc/query`

    // テーブル作成SQL
    const createTableQuery = `
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
        synced_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `

    // SQL実行リクエスト
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: createTableQuery
      })
    })

    const result = await response.text()

    if (!response.ok) {
      // 既にテーブルが存在するか、権限がない場合
      return NextResponse.json({
        success: false,
        error: 'Cannot create table via API',
        status: response.status,
        details: result,
        manualInstructions: {
          message: 'Please create the table manually in Supabase Dashboard',
          steps: [
            '1. Go to https://supabase.com/dashboard',
            '2. Select your project',
            '3. Click on "Table Editor" in the left menu',
            '4. Click "New Table" button',
            '5. Table name: calendar_events',
            '6. Add columns as specified in the SQL'
          ],
          alternativeMethod: {
            title: 'Or use SQL Editor:',
            steps: [
              '1. Go to SQL Editor in Supabase Dashboard',
              '2. Copy and paste the SQL from below',
              '3. Click "Run"'
            ],
            sql: createTableQuery
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Table creation attempted',
      result: result
    })

  } catch (error: any) {
    // 別の方法：テーブルエディタを使用
    return NextResponse.json({
      success: false,
      error: error.message,
      quickFix: {
        title: '🚀 簡単な解決方法',
        url: 'https://supabase.com/dashboard/project/_/editor',
        steps: [
          '1. Supabaseダッシュボードにログイン',
          '2. Table Editorを開く',
          '3. "New Table"をクリック',
          '4. Table name: "calendar_events"',
          '5. 以下のカラムを追加:',
          '   - event_id (text, unique)',
          '   - summary (text)',
          '   - description (text)',
          '   - start_time (timestamptz)',
          '   - end_time (timestamptz)',
          '   - location (text)',
          '   - meeting_url (text)',
          '   - attendees (jsonb)',
          '   - raw_data (jsonb)',
          '   - synced_at (timestamptz)',
          '6. "Save"をクリック'
        ]
      }
    })
  }
}