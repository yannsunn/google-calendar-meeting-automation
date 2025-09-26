#!/usr/bin/env node
const { google } = require('googleapis');
require('dotenv').config();

async function refreshToken() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('🔑 新しいアクセストークン:');
    console.log(credentials.access_token);
    console.log('\n📅 有効期限:', new Date(credentials.expiry_date).toLocaleString('ja-JP'));

    console.log('\n💡 N8Nで使用する値:');
    console.log(`Bearer ${credentials.access_token}`);

    console.log('\n📝 .envファイルを更新してください:');
    console.log(`GOOGLE_ACCESS_TOKEN=${credentials.access_token}`);

    return credentials.access_token;
  } catch (error) {
    console.error('❌ トークン更新エラー:', error.message);
  }
}

refreshToken();