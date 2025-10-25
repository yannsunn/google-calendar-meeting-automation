const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// スコープの設定
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback/google'
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 認証URLを生成
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('==============================================');
console.log('Google Calendar 認証セットアップ');
console.log('==============================================');
console.log('\n以下のURLをブラウザで開いて認証してください：\n');
console.log(authUrl);
console.log('\n==============================================');

rl.question('\n認証後に表示されたコードをここに貼り付けてEnterを押してください: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ トークンを取得しました');
    console.log('Access Token:', tokens.access_token ? '取得済み' : '取得失敗');
    console.log('Refresh Token:', tokens.refresh_token ? '取得済み' : '取得失敗');

    // .env.localファイルの内容を読み込み
    const envPath = '.env.local';
    let envContent = fs.readFileSync(envPath, 'utf8');

    // 既存のトークン行を削除（コメントアウトされたものも含む）
    envContent = envContent.replace(/^#?\s*GOOGLE_ACCESS_TOKEN=.*/gm, '');
    envContent = envContent.replace(/^#?\s*GOOGLE_REFRESH_TOKEN=.*/gm, '');

    // 新しいトークンを追加
    const newTokens = `
# Google Calendar OAuth Tokens (更新日: ${new Date().toISOString()})
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
`;

    // Google Calendar OAuthセクションを探して、その後に追加
    const calendarSectionIndex = envContent.indexOf('# Google Calendar OAuth');
    if (calendarSectionIndex !== -1) {
      const nextSectionIndex = envContent.indexOf('\n#', calendarSectionIndex + 1);
      if (nextSectionIndex !== -1) {
        envContent =
          envContent.slice(0, calendarSectionIndex) +
          '# Google Calendar OAuth設定（手動同期用）' +
          newTokens +
          envContent.slice(nextSectionIndex);
      } else {
        envContent = envContent + newTokens;
      }
    } else {
      envContent = envContent + newTokens;
    }

    // ファイルに書き込み
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ トークンが .env.local に保存されました');
    console.log('\n次のステップ:');
    console.log('1. npm run sync-calendar を実行してカレンダーデータを同期');
    console.log('2. npm run dev で開発サーバーを起動');
    console.log('3. http://localhost:3000/proposals で会議一覧を確認');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error('\nトラブルシューティング:');
    console.error('1. コードが正しくコピーされているか確認');
    console.error('2. Google Cloud ConsoleでOAuth 2.0クライアントIDが有効か確認');
    console.error('3. リダイレクトURIが正しく設定されているか確認');
  }

  rl.close();
});