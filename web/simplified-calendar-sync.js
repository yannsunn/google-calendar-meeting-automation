
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
