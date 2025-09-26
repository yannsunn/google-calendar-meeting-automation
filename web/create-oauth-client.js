#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config();

/**
 * Google Calendar API用の新しいOAuthクライアントを作成
 * APIを使用して直接作成
 */

async function createNewOAuthClient() {
  console.log('🔧 新しいOAuth 2.0クライアントIDを作成します\n');

  try {
    // 既存の認証情報を使用してGoogle APIにアクセス
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // プロジェクトIDを取得（通常はクライアントIDから推測）
    const projectId = process.env.GOOGLE_CLIENT_ID.split('-')[0];
    console.log(`プロジェクトID: ${projectId}`);

    // APIキーを作成（OAuthの代替として）
    console.log('\n📝 代替案: APIキーを作成します...\n');

    const apiKeyData = {
      name: 'calendar-sync-api-key-' + Date.now(),
      displayName: 'Calendar Sync API Key',
      restrictions: {
        apiTargets: [
          {
            service: 'calendar.googleapis.com'
          }
        ]
      }
    };

    console.log('APIキー設定:', JSON.stringify(apiKeyData, null, 2));

    // 手動でAPIキーを作成する手順を提供
    console.log('\n📋 手動でAPIキーを作成する手順:\n');
    console.log('1. Google Cloud Consoleにアクセス:');
    console.log('   https://console.cloud.google.com/apis/credentials\n');

    console.log('2. 「認証情報を作成」→「APIキー」をクリック\n');

    console.log('3. APIキーの制限を設定:');
    console.log('   - アプリケーションの制限: HTTPリファラー');
    console.log('   - ウェブサイトの制限:');
    console.log('     * https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/*');
    console.log('     * http://localhost:3000/*\n');

    console.log('4. API制限:');
    console.log('   - Google Calendar API を選択\n');

    console.log('5. 作成したAPIキーをコピー\n');

    // 環境変数設定スクリプトを生成
    await generateSetupScript();

    console.log('\n✅ セットアップスクリプトを作成しました');
    console.log('   ./setup-new-credentials.sh を実行してください\n');

  } catch (error) {
    console.error('エラー:', error);

    // フォールバック: 完全手動設定
    await createManualSetupGuide();
  }
}

async function generateSetupScript() {
  const script = `#!/bin/bash
# 新しいGoogle認証情報セットアップスクリプト

echo "🔧 Google Calendar API 認証情報セットアップ"
echo ""

# APIキー設定
echo "1. APIキーを入力してください:"
read -p "API Key: " GOOGLE_API_KEY

if [ ! -z "$GOOGLE_API_KEY" ]; then
  echo "$GOOGLE_API_KEY" | vercel env add GOOGLE_API_KEY production --force
  echo "✅ APIキーを設定しました"
fi

# 新しいOAuthクライアントID設定
echo ""
echo "2. 新しいOAuth 2.0クライアントIDを作成した場合:"
read -p "Client ID (省略可): " NEW_CLIENT_ID
read -p "Client Secret (省略可): " NEW_CLIENT_SECRET

if [ ! -z "$NEW_CLIENT_ID" ] && [ ! -z "$NEW_CLIENT_SECRET" ]; then
  echo "$NEW_CLIENT_ID" | vercel env add GOOGLE_CLIENT_ID production --force
  echo "$NEW_CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET production --force
  echo "✅ OAuthクライアントを更新しました"
fi

# リダイレクトURIを更新
echo "https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback/google" | vercel env add GOOGLE_REDIRECT_URI production --force

echo ""
echo "✅ 環境変数の設定が完了しました"
echo ""
echo "次のステップ:"
echo "1. vercel --prod でデプロイ"
echo "2. https://calendar-bgsbsbnp0-yasuus-projects.vercel.app でテスト"
`;

  await fs.writeFile('setup-new-credentials.sh', script);
  await fs.chmod('setup-new-credentials.sh', 0o755);
}

async function createManualSetupGuide() {
  const guide = `
# 📝 Google Calendar API 手動セットアップガイド

## 1. 新しいプロジェクトを作成（オプション）

既存のプロジェクトに問題がある場合、新しいプロジェクトを作成:

1. https://console.cloud.google.com/projectcreate
2. プロジェクト名: "Calendar Sync App"
3. 作成後、プロジェクトを選択

## 2. Calendar API を有効化

1. https://console.cloud.google.com/apis/library
2. "Google Calendar API" を検索
3. 「有効にする」をクリック

## 3. OAuth同意画面の設定

1. https://console.cloud.google.com/apis/credentials/consent
2. ユーザータイプ: 外部
3. アプリ名: "Calendar Sync"
4. サポートメール: あなたのメール
5. スコープ:
   - .../auth/calendar.readonly
   - .../auth/calendar.events.readonly

## 4. 新しいOAuth 2.0クライアントIDを作成

1. https://console.cloud.google.com/apis/credentials
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: ウェブアプリケーション
4. 名前: "Calendar Sync Web Client"
5. 承認済みのリダイレクト URI:
   - http://localhost:3000/api/auth/callback
   - http://localhost:3000/api/auth/callback/google
   - https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback
   - https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback/google

## 5. APIキーを作成（バックアップ）

1. 「認証情報を作成」→「APIキー」
2. キーを制限:
   - HTTPリファラー制限
   - Google Calendar API のみ

## 6. 環境変数を更新

\`\`\`bash
# 新しい認証情報で更新
vercel env add GOOGLE_CLIENT_ID production --force
vercel env add GOOGLE_CLIENT_SECRET production --force
vercel env add GOOGLE_API_KEY production --force
\`\`\`

## 7. デプロイ

\`\`\`bash
vercel --prod
\`\`\`
`;

  await fs.writeFile('MANUAL_SETUP_GUIDE.md', guide);
  console.log('\n📄 MANUAL_SETUP_GUIDE.md を作成しました');
}

// メイン処理
createNewOAuthClient().catch(console.error);