const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 直接認証コードを使用
const AUTH_CODE = process.argv[2];

if (!AUTH_CODE) {
  console.log('================================================');
  console.log('🔐 Google Calendar認証');
  console.log('================================================');
  console.log('\n使い方: node direct-calendar-auth.js [認証コード]');
  console.log('\n認証コードを取得するには:');
  console.log('1. 以下のURLをブラウザで開く:');
  console.log('\nhttps://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/calendar.readonly&prompt=consent&response_type=code&client_id=863342165958-injqmkknst50s15bma0rp04hlhla1lm7.apps.googleusercontent.com&redirect_uri=urn:ietf:wg:oauth:2.0:oob');
  console.log('\n2. Googleアカウントでログイン');
  console.log('3. 表示された認証コードをコピー');
  console.log('4. node direct-calendar-auth.js [コード] を実行');
  console.log('================================================\n');
  process.exit(0);
}

// OAuth2クライアントの設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

async function authenticateAndSync() {
  try {
    console.log('🔄 認証コードをトークンに交換中...');

    // 認証コードをトークンに交換
    const { tokens } = await oauth2Client.getToken(AUTH_CODE);
    oauth2Client.setCredentials(tokens);

    console.log('✅ 認証成功！');

    // トークンを.env.localに保存
    const envPath = '.env.local';
    let envContent = fs.readFileSync(envPath, 'utf8');

    // 既存のトークンを削除
    envContent = envContent.replace(/^#?\s*GOOGLE_ACCESS_TOKEN=.*/gm, '');
    envContent = envContent.replace(/^#?\s*GOOGLE_REFRESH_TOKEN=.*/gm, '');

    // 新しいトークンを追加
    const newTokens = `

# Google Calendar OAuth Tokens (${new Date().toISOString()})
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
`;

    envContent = envContent + newTokens;
    fs.writeFileSync(envPath, envContent);

    console.log('✅ トークンを保存しました\n');

    // カレンダーAPIを初期化
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    console.log('📅 カレンダーデータを取得中...\n');

    // 今日から7日間のイベントを取得
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`📊 ${events.length} 件のイベントを取得しました\n`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      const eventId = crypto.createHash('md5').update(event.id).digest('hex');
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;

      if (!startTime || !endTime) {
        skippedCount++;
        continue;
      }

      const attendees = event.attendees || [];
      const attendeeEmails = attendees.map(a => a.email);
      const externalAttendees = attendees
        .filter(a => a.email && !a.email.includes('yannsunn1116'))
        .map(a => a.email);

      const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);

      // 15分未満の短い会議はスキップ
      if (duration < 15) {
        console.log(`⏭️ スキップ: ${event.summary || '無題'} (${duration}分)`);
        skippedCount++;
        continue;
      }

      // 会社名の抽出（実際のデータから）
      let companyName = '';

      // タイトルから会社名を抽出
      if (event.summary) {
        // パターンマッチングで会社名を取得
        const patterns = [
          /(?:株式会社|有限会社|合同会社)(.+?)(?:\s|$)/,
          /(.+?)(?:株式会社|有限会社|合同会社)/,
          /【(.+?)】/,
          /\[(.+?)\]/,
          /「(.+?)」/,
          /with\s+(.+?)(?:\s|$)/i,
          /@ (.+?)(?:\s|$)/,
          /[-–—]\s*(.+?)(?:\s|$)/,
        ];

        for (const pattern of patterns) {
          const match = event.summary.match(pattern);
          if (match) {
            companyName = match[1].trim();
            break;
          }
        }
      }

      // 外部参加者のドメインから推定
      if (!companyName && externalAttendees.length > 0) {
        const email = externalAttendees[0];
        const domain = email.split('@')[1];
        if (domain && !domain.includes('gmail') && !domain.includes('yahoo')) {
          companyName = domain.split('.')[0];
        }
      }

      // それでも取得できない場合
      if (!companyName) {
        companyName = event.summary ? event.summary.substring(0, 30) : 'Meeting';
      }

      const eventData = {
        event_id: eventId,
        summary: event.summary || 'No Title',
        description: event.description || '',
        start_time: startTime,
        end_time: endTime,
        location: event.location || '',
        meeting_url: event.hangoutLink || '',
        organizer_email: event.organizer?.email || 'yannsunn1116@gmail.com',
        company_name: companyName,
        attendees: attendeeEmails,
        external_attendees: externalAttendees,
        has_external_attendees: externalAttendees.length > 0,
        external_count: externalAttendees.length,
        duration_minutes: duration,
        is_important: duration >= 30,
        status: event.status || 'confirmed',
        proposal_status: 'pending',
        synced_at: new Date().toISOString(),
        company_urls: []
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .upsert(eventData, { onConflict: 'event_id' });

      if (error) {
        console.error(`❌ エラー: ${event.summary}`, error.message);
      } else {
        console.log(`✅ 同期済み: ${event.summary || '無題'} - ${companyName}`);
        syncedCount++;
      }
    }

    console.log('\n================================================');
    console.log(`✅ 同期完了！`);
    console.log(`📊 ${syncedCount} 件のイベントを同期`);
    console.log(`⏭️ ${skippedCount} 件をスキップ`);
    console.log('================================================\n');

    console.log('🎯 次のステップ:');
    console.log('1. https://calendar-yasuus-projects.vercel.app/proposals にアクセス');
    console.log('2. 実際の会議データが表示されます');
    console.log('3. 会議を選択して提案資料を生成できます\n');

  } catch (error) {
    console.error('❌ エラー:', error.message);

    if (error.message.includes('invalid_grant')) {
      console.log('\n認証コードが無効または期限切れです。');
      console.log('新しい認証コードを取得してください。');
    }
  }
}

// 実行
authenticateAndSync();