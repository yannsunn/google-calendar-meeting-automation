const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

async function refreshAccessToken() {
  try {
    // リフレッシュトークンを設定
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // 新しいアクセストークンを取得
    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log('新しいアクセストークンを取得しました:');
    console.log('Access Token:', credentials.access_token);
    console.log('Expiry Date:', new Date(credentials.expiry_date));

    return credentials.access_token;
  } catch (error) {
    console.error('トークンのリフレッシュに失敗しました:', error.message);
    process.exit(1);
  }
}

refreshAccessToken();