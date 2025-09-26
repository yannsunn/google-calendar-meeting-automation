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

// 既存のクライアントIDでリダイレクトURIを複数試す
async function setupOAuthWithMultipleRedirects() {
  const redirectURIs = [
    'http://localhost:3000/api/auth/callback',
    'http://localhost:3000/api/auth/callback/google',
    'https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback',
    'https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback/google',
    'urn:ietf:wg:oauth:2.0:oob', // OOB方式（非推奨だが動作する可能性）
  ];

  console.log('🔐 Google Calendar OAuth セットアップ\n');
  console.log('利用可能なリダイレクトURIを試します...\n');

  for (const redirectURI of redirectURIs) {
    console.log(`\n試行中: ${redirectURI}`);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectURI
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

    console.log('\n認証URL:');
    console.log(authUrl);

    const useThis = await question('\nこのURLを使用しますか？ (y/n): ');

    if (useThis.toLowerCase() === 'y') {
      console.log('\n1. 上記のURLをブラウザで開いてください');
      console.log('2. Googleアカウントでログインして承認');
      console.log('3. 認証後に表示される認証コードをコピー');
      console.log('   - リダイレクトされた場合: URLから "code=" の後の文字列');
      console.log('   - コード表示の場合: 表示されたコードをそのまま\n');

      const code = await question('認証コードを入力してください: ');

      try {
        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n✅ トークン取得成功！\n');
        console.log('以下の値を環境変数として設定します:\n');
        console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`GOOGLE_REDIRECT_URI=${redirectURI}`);

        // .env.localファイルに保存
        const envContent = `
# Google OAuth Tokens (自動生成: ${new Date().toISOString()})
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
GOOGLE_REDIRECT_URI=${redirectURI}
`;

        await fs.appendFile('.env.local', envContent);
        console.log('\n✅ .env.local ファイルに保存しました');

        // Vercelに設定
        console.log('\n🚀 Vercelに環境変数を設定しています...');
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        try {
          await execAsync(`echo "${tokens.access_token}" | vercel env add GOOGLE_ACCESS_TOKEN production --force`);
          await execAsync(`echo "${tokens.refresh_token}" | vercel env add GOOGLE_REFRESH_TOKEN production --force`);
          await execAsync(`echo "${redirectURI}" | vercel env add GOOGLE_REDIRECT_URI production --force`);
          console.log('✅ Vercel環境変数の設定完了');
        } catch (vercelError) {
          console.log('⚠️  Vercel CLIでの設定に失敗しました。手動で設定してください。');
        }

        rl.close();
        return tokens;
      } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
        const retry = await question('別のリダイレクトURIを試しますか？ (y/n): ');
        if (retry.toLowerCase() !== 'y') {
          rl.close();
          return;
        }
      }
    }
  }

  console.log('\n❌ すべてのリダイレクトURIで失敗しました。');
  console.log('\nGoogle Cloud Consoleで以下のいずれかのURIを承認済みリストに追加してください:');
  redirectURIs.forEach(uri => console.log(`  - ${uri}`));

  rl.close();
}

// メイン処理
setupOAuthWithMultipleRedirects().catch(console.error);