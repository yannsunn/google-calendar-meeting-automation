#!/usr/bin/env node

/**
 * Google Calendar アクセス権限設定スクリプト
 * サービスアカウントにカレンダーへのアクセス権限を付与します
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupCalendarPermissions() {
  console.log('🔧 Google Calendar アクセス権限設定ツール');
  console.log('=====================================\n');

  try {
    // サービスアカウントの情報を取得
    const serviceAccountEmail = 'calendar-sync-service@amazon-457206.iam.gserviceaccount.com';
    console.log(`📧 サービスアカウント: ${serviceAccountEmail}\n`);

    // ユーザーのGoogle認証情報を使用してカレンダーAPIにアクセス
    console.log('このスクリプトを実行するには、カレンダーの所有者のGoogleアカウントでログインする必要があります。\n');

    // OAuth2クライアントを作成（カレンダー所有者用）
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || await question('Google Client ID を入力してください: '),
      process.env.GOOGLE_CLIENT_SECRET || await question('Google Client Secret を入力してください: '),
      'http://localhost:3000/api/auth/callback'
    );

    // 認証URLを生成
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.acls'
      ]
    });

    console.log('\n以下のURLをブラウザで開いて認証してください:');
    console.log(authUrl);

    const code = await question('\n認証後に表示されるコードを入力してください: ');

    // トークンを取得
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Calendar APIクライアントを作成
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // カレンダーIDを取得
    const calendarId = await question('\nカレンダーID を入力してください (空の場合は "primary" を使用): ') || 'primary';

    // ACL（アクセス制御リスト）にサービスアカウントを追加
    console.log('\n📝 カレンダーへのアクセス権限を設定中...');

    const aclRule = {
      role: 'reader', // 'reader' または 'writer' を選択可能
      scope: {
        type: 'user',
        value: serviceAccountEmail
      }
    };

    try {
      const result = await calendar.acl.insert({
        calendarId: calendarId,
        resource: aclRule
      });

      console.log('✅ アクセス権限を正常に設定しました！');
      console.log(`   カレンダーID: ${calendarId}`);
      console.log(`   サービスアカウント: ${serviceAccountEmail}`);
      console.log(`   権限: 読み取り専用`);
      console.log('\n🎉 設定完了！カレンダー同期が正常に動作するはずです。');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  このサービスアカウントには既にアクセス権限が設定されています。');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);

    // 代替方法を提案
    console.log('\n📋 手動で設定する場合の手順:');
    console.log('1. Google Calendar (https://calendar.google.com) を開く');
    console.log('2. 設定 → カレンダーの設定を選択');
    console.log('3. 共有したいカレンダーを選択');
    console.log('4. 「特定のユーザーまたはグループと共有」セクション');
    console.log('5. 以下のメールアドレスを追加:');
    console.log(`   ${serviceAccountEmail || 'calendar-sync-service@amazon-457206.iam.gserviceaccount.com'}`);
    console.log('6. 権限を「閲覧権限（すべての予定の詳細）」に設定');
    console.log('7. 「送信」をクリック');
  } finally {
    rl.close();
  }
}

// スクリプトを実行
setupCalendarPermissions();