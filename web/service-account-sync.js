const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
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

// OAuth2クライアントの設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // オフラインアクセス用
);

// 認証URLを生成
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

async function getAuthUrl() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('===============================================');
  console.log('🔐 Google認証が必要です');
  console.log('===============================================');
  console.log('\n以下のURLをブラウザで開いてください:');
  console.log('\n' + authUrl);
  console.log('\n認証後に表示される認証コードが必要です。');
  console.log('===============================================\n');

  return authUrl;
}

async function exchangeCodeForToken(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // トークンを.env.localに保存
    const envPath = '.env.local';
    let envContent = fs.readFileSync(envPath, 'utf8');

    // 既存のトークンを削除
    envContent = envContent.replace(/^#?\s*GOOGLE_ACCESS_TOKEN=.*/gm, '');
    envContent = envContent.replace(/^#?\s*GOOGLE_REFRESH_TOKEN=.*/gm, '');

    // 新しいトークンを追加
    const newTokens = `

# Google Calendar OAuth Tokens (更新日: ${new Date().toISOString()})
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
`;

    envContent = envContent + newTokens;
    fs.writeFileSync(envPath, envContent);

    console.log('✅ トークンを保存しました');
    return tokens;
  } catch (error) {
    console.error('❌ トークン取得エラー:', error.message);
    throw error;
  }
}

async function syncCalendarEvents() {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
      const eventId = crypto.createHash('md5').update(event.id).digest('hex');
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;

      if (!startTime || !endTime) {
        console.log(`⏭️ スキップ: ${event.summary} (時刻情報なし)`);
        skippedCount++;
        continue;
      }

      const attendees = event.attendees || [];
      const attendeeEmails = attendees.map(a => a.email);
      const externalAttendees = attendees
        .filter(a => a.email && !a.email.includes('yannsunn1116'))
        .map(a => a.email);

      const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);

      if (duration < 15) {
        console.log(`⏭️ スキップ: ${event.summary} (${duration}分 - 短すぎる)`);
        skippedCount++;
        continue;
      }

      // 会社名の推定（改善版）
      let companyName = 'Unknown Company';

      // 複数のパターンで会社名を抽出
      const patterns = [
        /(?:株式会社|有限会社|合同会社|LLC|Inc\.|Corp\.|Co\.,? Ltd\.?)[\s]*(.+?)(?:\s|$)/,
        /(.+?)(?:株式会社|有限会社|合同会社)/,
        /[-–—]\s*(.+?)(?:\s|$)/,
        /【(.+?)】/,
        /\[(.+?)\]/,
        /「(.+?)」/,
        /with\s+(.+?)(?:\s|$)/i,
        /@ (.+?)(?:\s|$)/,
      ];

      if (event.summary) {
        for (const pattern of patterns) {
          const match = event.summary.match(pattern);
          if (match) {
            companyName = match[1].trim();
            // 会社形態の接尾辞を追加
            if (event.summary.includes('株式会社') && !companyName.includes('株式会社')) {
              companyName = companyName + '株式会社';
            }
            break;
          }
        }
      }

      // まだ Unknown の場合は外部参加者のドメインから推定
      if (companyName === 'Unknown Company' && externalAttendees.length > 0) {
        const domain = externalAttendees[0].split('@')[1];
        if (domain) {
          const domainParts = domain.split('.');
          companyName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
        }
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
        is_important: duration >= 30 && externalAttendees.length > 0,
        status: event.status || 'confirmed',
        proposal_status: 'pending',
        synced_at: new Date().toISOString(),
        company_urls: []  // 初期値として空配列を設定
      };

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
    console.log(`✅ 同期完了: ${syncedCount} 件のイベントを同期しました`);
    console.log(`⏭️ スキップ: ${skippedCount} 件`);
    console.log('==============================================\n');

    return { syncedCount, skippedCount, totalEvents: events.length };

  } catch (error) {
    console.error('❌ 同期エラー:', error.message);
    throw error;
  }
}

// 自動実行用のメイン関数
async function main() {
  // まず認証コードを自動で取得を試みる
  const puppeteer = require('puppeteer');

  try {
    console.log('🤖 自動認証を開始します...\n');

    const browser = await puppeteer.launch({
      headless: false, // ブラウザを表示
      defaultViewport: null
    });

    const page = await browser.newPage();

    // 認証URLを生成
    const authUrl = await getAuthUrl();

    // ブラウザで認証ページを開く
    await page.goto(authUrl);

    // ユーザーがログインして承認するのを待つ（最大3分）
    console.log('ブラウザでGoogleにログインして、アクセスを許可してください...\n');

    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || '';
        return text.includes('4/0') || text.includes('code=');
      },
      { timeout: 180000 } // 3分待機
    );

    // 認証コードを取得
    let code = '';
    const pageContent = await page.evaluate(() => document.body.innerText);

    // コードを抽出
    const codeMatch = pageContent.match(/4\/0[A-Za-z0-9\-_]+/);
    if (codeMatch) {
      code = codeMatch[0];
    } else {
      // URLからコードを取得
      const url = page.url();
      const urlParams = new URLSearchParams(url.split('?')[1]);
      code = urlParams.get('code') || '';
    }

    await browser.close();

    if (code) {
      console.log('✅ 認証コードを取得しました');

      // トークンに交換
      const tokens = await exchangeCodeForToken(code);

      // カレンダー同期を実行
      const result = await syncCalendarEvents();

      console.log('✅ 完了しました！');
      console.log('本番環境へのデプロイ: git push origin main');

      process.exit(0);
    } else {
      throw new Error('認証コードを取得できませんでした');
    }

  } catch (error) {
    console.error('自動認証に失敗しました。手動で認証してください。');

    // 手動認証にフォールバック
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await getAuthUrl();

    rl.question('\n認証コードを入力してください: ', async (code) => {
      try {
        const tokens = await exchangeCodeForToken(code);
        const result = await syncCalendarEvents();

        console.log('✅ 完了しました！');
        console.log('本番環境へのデプロイ: git push origin main');

        rl.close();
        process.exit(0);
      } catch (error) {
        console.error('エラー:', error);
        rl.close();
        process.exit(1);
      }
    });
  }
}

// Puppeteerがインストールされているか確認
try {
  require('puppeteer');
  main();
} catch (error) {
  // Puppeteerがない場合は手動認証
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  getAuthUrl().then(() => {
    rl.question('\n認証コードを入力してください: ', async (code) => {
      try {
        const tokens = await exchangeCodeForToken(code);
        const result = await syncCalendarEvents();

        console.log('✅ 完了しました！');
        console.log('本番環境へのデプロイ: git push origin main');

        rl.close();
        process.exit(0);
      } catch (error) {
        console.error('エラー:', error);
        rl.close();
        process.exit(1);
      }
    });
  });
}