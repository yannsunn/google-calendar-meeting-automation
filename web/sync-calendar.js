const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Google OAuth2クライアントの設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback/google'
);

// トークンを設定
oauth2Client.setCredentials({
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function syncCalendarEvents() {
  try {
    console.log('📅 カレンダー同期を開始します...\n');

    // 今日から7日間のイベントを取得
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    console.log(`期間: ${timeMin.toLocaleDateString()} から ${timeMax.toLocaleDateString()}\n`);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`✅ ${events.length} 件のイベントを取得しました\n`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      // イベントIDの生成（Google Calendar IDをハッシュ化）
      const eventId = crypto.createHash('md5').update(event.id).digest('hex');

      // 開始時刻と終了時刻
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;

      if (!startTime || !endTime) {
        console.log(`⏭️ スキップ: ${event.summary} (時刻情報なし)`);
        skippedCount++;
        continue;
      }

      // 参加者情報の処理
      const attendees = event.attendees || [];
      const attendeeEmails = attendees.map(a => a.email);
      const externalAttendees = attendees
        .filter(a => a.email && !a.email.includes('yannsunn1116'))
        .map(a => a.email);

      // 会議時間の計算（分）
      const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);

      // 15分未満の短い会議はスキップ
      if (duration < 15) {
        console.log(`⏭️ スキップ: ${event.summary} (${duration}分 - 短すぎる)`);
        skippedCount++;
        continue;
      }

      // 会社名の推定（タイトルから抽出）
      let companyName = 'Unknown Company';
      const titleMatch = event.summary?.match(/[-–—]\s*(.+?)(?:\s|$)/);
      if (titleMatch) {
        companyName = titleMatch[1].trim();
      } else if (externalAttendees.length > 0) {
        // 外部参加者のドメインから推定
        const domain = externalAttendees[0].split('@')[1];
        if (domain) {
          companyName = domain.split('.')[0];
        }
      }

      // Supabaseに保存するデータ
      const eventData = {
        event_id: eventId,
        summary: event.summary || 'No Title',
        description: event.description || '',
        start_time: startTime,
        end_time: endTime,
        location: event.location || '',
        meeting_url: event.hangoutLink || '',
        organizer_email: event.organizer?.email || 'unknown@example.com',
        company_name: companyName,
        attendees: attendeeEmails,
        external_attendees: externalAttendees,
        has_external_attendees: externalAttendees.length > 0,
        external_count: externalAttendees.length,
        duration_minutes: duration,
        is_important: duration >= 30 && externalAttendees.length > 0,
        status: event.status || 'confirmed',
        proposal_status: 'pending',
        synced_at: new Date().toISOString()
      };

      // Supabaseに挿入または更新
      const { data, error } = await supabase
        .from('calendar_events')
        .upsert(eventData, { onConflict: 'event_id' });

      if (error) {
        console.error(`❌ エラー: ${event.summary}`, error.message);
      } else {
        console.log(`✅ 同期済み: ${event.summary} (${duration}分) - ${companyName}`);
        syncedCount++;
      }
    }

    console.log('\n==============================================');
    console.log(`同期完了: ${syncedCount} 件のイベントを同期しました`);
    console.log(`スキップ: ${skippedCount} 件`);
    console.log('==============================================\n');

    console.log('次のステップ:');
    console.log('1. Vercelで本番環境にデプロイ: git push origin main');
    console.log('2. https://calendar-yasuus-projects.vercel.app/proposals で確認');

  } catch (error) {
    console.error('❌ 同期エラー:', error.message);

    if (error.message.includes('invalid_grant')) {
      console.error('\nトークンが期限切れです。以下を実行してください:');
      console.error('node setup-calendar-auth.js');
    }
  }
}

// メイン実行
syncCalendarEvents();