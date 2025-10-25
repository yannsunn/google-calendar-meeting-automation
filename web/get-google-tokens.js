const http = require('http');
const url = require('url');
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:8080/callback'
);

const PORT = 8080;

console.log('================================================');
console.log('🔐 Google Calendar 認証');
console.log('================================================\n');

// 認証URL生成
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar.readonly'],
  prompt: 'consent'
});

console.log('以下のURLをブラウザで開いてください:\n');
console.log(authUrl);
console.log('\n認証後、自動的にトークンを取得します...\n');

// 一時的なHTTPサーバーを起動
const server = http.createServer(async (req, res) => {
  const queryParams = url.parse(req.url, true).query;

  if (queryParams.code) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h1>✅ 認証成功！</h1>
          <p>このウィンドウを閉じて、ターミナルに戻ってください。</p>
        </body>
      </html>
    `);

    try {
      // 認証コードをトークンに交換
      const { tokens } = await oauth2Client.getToken(queryParams.code);

      console.log('✅ 認証成功！\n');
      console.log('================================================');
      console.log('取得したトークン:');
      console.log('================================================\n');
      console.log('Access Token:', tokens.access_token);
      console.log('\nRefresh Token:', tokens.refresh_token);
      console.log('\nExpiry:', new Date(tokens.expiry_date));
      console.log('\n================================================');
      console.log('次のステップ:');
      console.log('================================================\n');
      console.log('以下のコマンドを実行してVercelに追加してください:\n');
      console.log(`printf "${tokens.access_token}" | npx vercel env add GOOGLE_ACCESS_TOKEN production\n`);

      if (tokens.refresh_token) {
        console.log(`printf "${tokens.refresh_token}" | npx vercel env add GOOGLE_REFRESH_TOKEN production\n`);
      }

      console.log('================================================\n');

      server.close();
    } catch (error) {
      console.error('❌ エラー:', error.message);
      server.close();
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n🌐 ローカルサーバーを起動しました (ポート ${PORT})\n`);
});

// タイムアウト処理
setTimeout(() => {
  console.log('\n⏱️ タイムアウト: 認証が完了しませんでした');
  server.close();
  process.exit(1);
}, 300000); // 5分
