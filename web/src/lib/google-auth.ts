import { google } from 'googleapis';

/**
 * Googleトークンを自動的にリフレッシュするヘルパー関数
 */
export async function getValidAccessToken(): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // リフレッシュトークンを設定
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    // 既存のアクセストークンを試す
    if (process.env.GOOGLE_ACCESS_TOKEN) {
      oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    // トークンが期限切れの場合、自動的にリフレッシュ
    const { credentials } = await oauth2Client.refreshAccessToken();

    return credentials.access_token!;
  } catch (error) {
    console.error('トークンのリフレッシュに失敗:', error);
    throw new Error('Google認証に失敗しました。再認証が必要です。');
  }
}

/**
 * Google Calendar APIクライアントを取得
 */
export async function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
