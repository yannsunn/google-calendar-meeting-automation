#!/usr/bin/env node
const https = require('https');
require('dotenv').config();

// Google Calendar同期ワークフロー
const calendarWorkflow = {
  name: "Google Calendar 自動同期 - 1週間分",
  settings: {
    executionOrder: "v1"
  },
  nodes: [
    {
      parameters: {
        rule: {
          interval: [
            { field: 'hours', hoursInterval: 1 }
          ]
        }
      },
      name: "1時間ごとに実行",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1,
      position: [250, 300],
      id: "schedule"
    },
    {
      parameters: {
        url: "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`
            }
          ]
        },
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: "timeMin",
              value: "={{new Date().toISOString()}}"
            },
            {
              name: "timeMax",
              value: "={{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}}"
            },
            {
              name: "singleEvents",
              value: "true"
            },
            {
              name: "orderBy",
              value: "startTime"
            },
            {
              name: "maxResults",
              value: "100"
            }
          ]
        },
        options: {}
      },
      name: "Google Calendar API呼び出し",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 3,
      position: [450, 300],
      id: "googleCalendarApi"
    },
    {
      parameters: {
        jsCode: `// イベントデータを整形
const items = $input.all();
const events = items[0].json.items || [];

return events.map(event => ({
  json: {
    event_id: event.id,
    summary: event.summary || 'タイトルなし',
    description: event.description || '',
    start_time: event.start?.dateTime || event.start?.date,
    end_time: event.end?.dateTime || event.end?.date,
    location: event.location || '',
    meeting_url: event.hangoutLink || '',
    organizer_email: event.organizer?.email || '',
    attendees: (event.attendees || []).map(a => ({
      email: a.email,
      name: a.displayName || a.email.split('@')[0],
      response: a.responseStatus || 'needsAction',
      is_organizer: a.organizer || false
    })),
    raw_data: event,
    synced_at: new Date().toISOString()
  }
}));`
      },
      name: "データ整形",
      type: "n8n-nodes-base.code",
      typeVersion: 1,
      position: [650, 300],
      id: "formatData"
    },
    {
      parameters: {
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/calendar_events`,
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        httpMethod: "POST",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "apikey",
              value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            },
            {
              name: "Authorization",
              value: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            {
              name: "Content-Type",
              value: "application/json"
            },
            {
              name: "Prefer",
              value: "resolution=merge-duplicates"
            }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "={{$json}}"
            }
          ]
        },
        options: {}
      },
      name: "Supabaseに保存",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 3,
      position: [850, 300],
      id: "saveToSupabase"
    },
    {
      parameters: {
        values: {
          string: [
            {
              name: "status",
              value: "success"
            },
            {
              name: "message",
              value: "カレンダーイベントを同期しました"
            }
          ],
          number: [
            {
              name: "synced_events",
              value: "={{$items().length}}"
            }
          ]
        },
        options: {}
      },
      name: "実行結果",
      type: "n8n-nodes-base.set",
      typeVersion: 1,
      position: [1050, 300],
      id: "result"
    }
  ],
  connections: {
    "1時間ごとに実行": {
      "main": [
        [
          {
            "node": "Google Calendar API呼び出し",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Calendar API呼び出し": {
      "main": [
        [
          {
            "node": "データ整形",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "データ整形": {
      "main": [
        [
          {
            "node": "Supabaseに保存",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Supabaseに保存": {
      "main": [
        [
          {
            "node": "実行結果",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

// N8N APIでワークフローを作成
async function createWorkflow() {
  const n8nUrl = process.env.N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    console.error('❌ N8N_URL または N8N_API_KEY が設定されていません');
    return;
  }

  return new Promise((resolve) => {
    const url = new URL('/api/v1/workflows', n8nUrl);
    const data = JSON.stringify(calendarWorkflow);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const result = JSON.parse(responseData);
          console.log('✅ ワークフローを作成しました');
          console.log(`📌 ワークフローID: ${result.id}`);
          console.log(`📌 ワークフロー名: ${result.name}`);
          console.log(`📌 状態: ${result.active ? 'アクティブ' : '非アクティブ'}`);
          resolve(result);
        } else {
          console.error(`❌ 作成失敗 (Status: ${res.statusCode})`);
          console.error(`詳細: ${responseData}`);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ 接続エラー:', err.message);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

// メイン処理
async function main() {
  console.log('🚀 Google Calendar同期ワークフロー作成\n');
  console.log('📋 ワークフロー機能:');
  console.log('   - 1時間ごとに自動実行');
  console.log('   - 今後1週間分のイベントを取得');
  console.log('   - Supabaseに自動保存');
  console.log('   - 重複イベントは自動更新\n');

  const result = await createWorkflow();

  if (result) {
    console.log('\n✅ セットアップ完了！');
    console.log('\n💡 次のステップ:');
    console.log('1. N8Nダッシュボードでワークフローを確認');
    console.log(`   ${process.env.N8N_URL}/workflow/${result.id}`);
    console.log('2. 必要に応じて実行頻度を調整');
    console.log('3. 手動実行でテスト');
  }
}

main().catch(console.error);