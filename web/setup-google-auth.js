#!/usr/bin/env node
const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs').promises;
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getNewToken() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/callback'
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  console.log('🔐 Google Calendar認証セットアップ\n');
  console.log('1. 以下のURLをブラウザで開いてください:');
  console.log(authUrl);
  console.log('\n2. Googleアカウントでログインして承認');
  console.log('3. リダイレクトされたURLから "code=" の後の文字列をコピー\n');

  const code = await question('認証コードを入力してください: ');

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ トークン取得成功！\n');
    console.log('以下の値を .env ファイルに追加してください:\n');
    console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

    // .env.localファイルに自動保存
    const envContent = `
# Google OAuth Tokens (自動生成: ${new Date().toISOString()})
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
`;

    await fs.appendFile('.env.local', envContent);
    console.log('\n✅ .env.local ファイルに保存しました');

    return tokens;
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    rl.close();
  }
}

// メイン処理
getNewToken().catch(console.error);