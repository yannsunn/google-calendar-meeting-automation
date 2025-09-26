#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs').promises;
require('dotenv').config();

/**
 * サービスアカウントを使用したGoogle Calendar API接続
 * ユーザー認証不要で動作
 */

async function setupServiceAccount() {
  console.log('📋 サービスアカウントによるカレンダー同期設定\n');

  // 既存のクライアントIDとシークレットを使用してOAuth2クライアントを作成
  // しかし、別の方法として直接APIキーを使用することも可能

  console.log('現在の設定:');
  console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '設定済み' : '未設定');

  console.log('\n🔧 代替設定方法:\n');

  console.log('1. APIキー方式（読み取り専用）');
  console.log('   - Google Cloud Console → APIとサービス → 認証情報');
  console.log('   - 「認証情報を作成」→「APIキー」');
  console.log('   - Calendar API を有効化');
  console.log('   - 環境変数: GOOGLE_API_KEY');

  console.log('\n2. サービスアカウント方式（推奨）');
  console.log('   - Google Cloud Console → IAMと管理 → サービスアカウント');
  console.log('   - 新しいサービスアカウントを作成');
  console.log('   - JSONキーをダウンロード');
  console.log('   - カレンダーを共有（サービスアカウントのメールアドレスを追加）');

  console.log('\n3. 既存トークンの手動設定');
  console.log('   以下のコマンドで直接トークンを設定:');
  console.log('   vercel env add GOOGLE_ACCESS_TOKEN production');
  console.log('   vercel env add GOOGLE_REFRESH_TOKEN production');

  // 簡易的な解決策を提供
  await generateSimplifiedAuth();
}

async function generateSimplifiedAuth() {
  console.log('\n📝 簡易認証セットアップファイルを生成します...\n');

  const simplifiedAuthCode = `
// 簡易カレンダー同期設定（サービスアカウント不要版）
const { google } = require('googleapis');

// 公開カレンダーの場合はAPIキーのみで読み取り可能
async function syncWithApiKey() {
  const calendar = google.calendar({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY // APIキーのみ使用
  });

  try {
    // 公開カレンダーのイベント取得
    const response = await calendar.events.list({
      calendarId: 'primary', // または特定のカレンダーID
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error:', error);
    // プライベートカレンダーの場合はOAuth必要
    return null;
  }
}

// 代替: ハードコードされたトークンを使用（一時的な解決策）
async function syncWithHardcodedToken() {
  const oauth2Client = new google.auth.OAuth2();

  // 環境変数から直接トークンを設定
  oauth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // カレンダーイベント取得
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items;
}

module.exports = { syncWithApiKey, syncWithHardcodedToken };
`;

  await fs.writeFile('simplified-calendar-sync.js', simplifiedAuthCode);
  console.log('✅ simplified-calendar-sync.js を作成しました');

  // 環境変数設定用のスクリプトも生成
  const envSetupScript = `#!/bin/bash
# Vercel環境変数設定スクリプト

echo "🔧 Vercel環境変数を設定します..."

# APIキー方式（公開カレンダー用）
echo "APIキーを入力（省略可）:"
read GOOGLE_API_KEY
if [ ! -z "$GOOGLE_API_KEY" ]; then
  echo "$GOOGLE_API_KEY" | vercel env add GOOGLE_API_KEY production --force
fi

# 既存のトークンを使用する場合
echo "アクセストークンを入力（省略可）:"
read GOOGLE_ACCESS_TOKEN
if [ ! -z "$GOOGLE_ACCESS_TOKEN" ]; then
  echo "$GOOGLE_ACCESS_TOKEN" | vercel env add GOOGLE_ACCESS_TOKEN production --force
fi

echo "リフレッシュトークンを入力（省略可）:"
read GOOGLE_REFRESH_TOKEN
if [ ! -z "$GOOGLE_REFRESH_TOKEN" ]; then
  echo "$GOOGLE_REFRESH_TOKEN" | vercel env add GOOGLE_REFRESH_TOKEN production --force
fi

echo "✅ 設定完了"
`;

  await fs.writeFile('setup-vercel-env.sh', envSetupScript);
  await fs.chmod('setup-vercel-env.sh', 0o755);
  console.log('✅ setup-vercel-env.sh を作成しました');

  console.log('\n📌 次のステップ:');
  console.log('1. Google Cloud ConsoleでAPIキーを作成');
  console.log('2. ./setup-vercel-env.sh を実行して環境変数を設定');
  console.log('3. vercel --prod でデプロイ');
}

// メイン処理
setupServiceAccount().catch(console.error);