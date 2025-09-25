#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

async function testCalendarSync() {
  console.log('🚀 Google Calendar同期テスト開始\n');

  // ローカルAPIエンドポイント
  const apiUrl = 'http://localhost:3000/api/calendar/sync';

  try {
    console.log('📅 カレンダーイベントを同期中（7日間）...\n');

    const response = await axios.post(apiUrl, {
      days: 7
    });

    if (response.data.success) {
      console.log('✅ 同期成功！');
      console.log(`📊 同期したイベント数: ${response.data.eventsCount}`);

      if (response.data.events && response.data.events.length > 0) {
        console.log('\n📋 イベント一覧:');
        console.log('================');

        response.data.events.forEach((event, index) => {
          console.log(`\n${index + 1}. ${event.title || 'タイトルなし'}`);
          console.log(`   開始: ${new Date(event.start).toLocaleString('ja-JP')}`);
          console.log(`   終了: ${new Date(event.end).toLocaleString('ja-JP')}`);
          console.log(`   参加者数: ${event.attendees}`);
        });
      } else {
        console.log('\n📝 今後7日間にイベントはありません');
      }
    } else {
      console.error('❌ 同期失敗:', response.data.error);
    }

    // データ取得テスト
    console.log('\n\n📊 保存されたデータの確認...');
    const meetingsResponse = await axios.get('http://localhost:3000/api/meetings?days=7');

    if (Array.isArray(meetingsResponse.data)) {
      console.log(`✅ データベースから ${meetingsResponse.data.length} 件のミーティングを取得`);
    } else {
      console.log('⚠️  データベースからデータを取得できませんでした');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ APIエラー:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ サーバーに接続できません。`npm run dev`でサーバーを起動してください。');
    } else {
      console.error('❌ エラー:', error.message);
    }
  }
}

// メイン処理
testCalendarSync().catch(console.error);