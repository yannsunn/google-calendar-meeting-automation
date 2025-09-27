#!/usr/bin/env node

/**
 * Supabase テーブル作成スクリプト
 * calendar_eventsテーブルをSupabaseに作成します
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabaseTables() {
  console.log('🔧 Supabase テーブルセットアップ');
  console.log('=====================================\n');

  // 環境変数から認証情報を取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ エラー: Supabase環境変数が設定されていません');
    console.log('以下の環境変数を設定してください:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL または SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Supabaseクライアントを作成
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // SQLファイルを読み込み
  const sqlPath = path.join(__dirname, 'create-calendar-events-table.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('📝 以下のSQLを実行します:\n');
  console.log(sqlContent.substring(0, 500) + '...\n');

  try {
    // SQLを実行（各ステートメントを個別に実行）
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') ||
          statement.includes('CREATE INDEX') ||
          statement.includes('CREATE POLICY') ||
          statement.includes('CREATE TRIGGER') ||
          statement.includes('CREATE FUNCTION') ||
          statement.includes('ALTER TABLE') ||
          statement.includes('GRANT')) {

        console.log(`実行中: ${statement.substring(0, 50)}...`);

        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement
        }).maybeSingle();

        if (error && !error.message.includes('already exists')) {
          console.error(`❌ エラー: ${error.message}`);
        } else {
          console.log(`✅ 完了`);
        }
      }
    }

    // テーブルの存在確認
    const { data: tables, error: tableError } = await supabase
      .from('calendar_events')
      .select('*')
      .limit(1);

    if (!tableError) {
      console.log('\n✅ calendar_eventsテーブルが正常に作成されました！');

      // テーブル情報を表示
      const { count } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true });

      console.log(`   現在のレコード数: ${count || 0}`);
    } else {
      console.log('\n⚠️  テーブル作成を確認できませんでした。');
      console.log('   Supabaseダッシュボードで直接SQLを実行してください。');
      console.log('   SQL: create-calendar-events-table.sql');
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
    console.log('\n📋 手動でテーブルを作成する場合:');
    console.log('1. Supabaseダッシュボードにログイン');
    console.log('2. SQL Editorを開く');
    console.log('3. create-calendar-events-table.sqlの内容をコピー&ペースト');
    console.log('4. 実行');
  }
}

// 環境変数をロード（.env.localファイルがある場合）
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenvがない場合は無視
}

setupSupabaseTables();