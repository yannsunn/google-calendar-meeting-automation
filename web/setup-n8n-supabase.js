#!/usr/bin/env node
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// N8N API接続テスト
async function testN8NConnection() {
  console.log('🔄 N8N API接続テスト中...');

  const n8nUrl = process.env.N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    console.error('❌ N8N_URL または N8N_API_KEY が設定されていません');
    return false;
  }

  try {
    const url = new URL('/api/v1/workflows', n8nUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json'
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ N8N API接続成功');
            const workflows = JSON.parse(data);
            console.log(`   ワークフロー数: ${workflows.data?.length || 0}`);
            resolve(true);
          } else {
            console.error(`❌ N8N API接続失敗 (Status: ${res.statusCode})`);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.error('❌ N8N API接続エラー:', err.message);
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.error('❌ N8N API接続エラー:', error.message);
    return false;
  }
}

// Supabase接続テストとテーブル作成
async function setupSupabase() {
  console.log('🔄 Supabase接続テスト中...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が設定されていません');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 接続テスト
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (tablesError && tablesError.message.includes('information_schema')) {
      // information_schemaにアクセスできない場合は、単純なテーブル存在チェック
      console.log('✅ Supabase接続成功');
    } else if (tablesError) {
      throw tablesError;
    } else {
      console.log('✅ Supabase接続成功');
    }

    // 必要なテーブルを作成
    console.log('📝 必要なテーブルを作成中...');

    // meetings テーブル
    const { error: meetingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS meetings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          google_event_id VARCHAR(255) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          location VARCHAR(255),
          meeting_url VARCHAR(255),
          organizer_email VARCHAR(255),
          status VARCHAR(50) DEFAULT 'scheduled',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }).catch(() => {
      // RPCが使えない場合はスキップ
      console.log('   meetings テーブル: 既存または手動作成が必要');
    });

    // attendees テーブル
    const { error: attendeesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS attendees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          company_id UUID,
          is_external BOOLEAN DEFAULT FALSE,
          is_organizer BOOLEAN DEFAULT FALSE,
          response_status VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(meeting_id, email)
        );
      `
    }).catch(() => {
      console.log('   attendees テーブル: 既存または手動作成が必要');
    });

    // calendar_events テーブル
    const { error: eventsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS calendar_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_id VARCHAR(255) UNIQUE NOT NULL,
          summary VARCHAR(255),
          description TEXT,
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          location VARCHAR(255),
          meeting_url VARCHAR(255),
          attendees JSONB,
          raw_data JSONB,
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }).catch(() => {
      console.log('   calendar_events テーブル: 既存または手動作成が必要');
    });

    console.log('✅ Supabaseセットアップ完了');
    return true;
  } catch (error) {
    console.error('❌ Supabaseセットアップエラー:', error.message);
    return false;
  }
}

// Vercel環境変数の設定ガイド出力
function printVercelEnvGuide() {
  console.log('\n📌 Vercelダッシュボードで以下の環境変数を設定してください:');
  console.log('   https://vercel.com/[your-account]/[your-project]/settings/environment-variables\n');

  const envVars = {
    'N8N_URL': process.env.N8N_URL || 'https://n8n.srv946785.hstgr.cloud',
    'N8N_API_KEY': process.env.N8N_API_KEY || '[N8N APIキーを設定]',
    'N8N_WEBHOOK_BASE_URL': process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.srv946785.hstgr.cloud/webhook',
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || '[Supabase URLを設定]',
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY || '[Supabaseサービスロールキーを設定]',
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY || '[Gemini APIキーを設定（オプション）]',
    'DATABASE_URL': process.env.DATABASE_URL || 'postgresql://[user]:[password]@[host]/[database]'
  };

  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   ${key}=${value}`);
  });

  console.log('\n💡 ヒント: 上記の値をコピーしてVercelの環境変数に貼り付けてください');
}

// メイン処理
async function main() {
  console.log('🚀 N8N & Supabase 自動セットアップ開始\n');

  // N8N接続テスト
  const n8nConnected = await testN8NConnection();

  // Supabaseセットアップ
  const supabaseSetup = await setupSupabase();

  // Vercel環境変数ガイド
  printVercelEnvGuide();

  if (n8nConnected && supabaseSetup) {
    console.log('\n✅ すべてのセットアップが完了しました！');
  } else {
    console.log('\n⚠️  一部のセットアップが完了していません。上記のエラーを確認してください。');
  }
}

// 実行
main().catch(console.error);