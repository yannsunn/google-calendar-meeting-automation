#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
require('dotenv').config();

// カレンダー同期ワークフローの定義
const calendarSyncWorkflow = {
  name: "Google Calendar Sync",
  active: true,
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "calendar-sync",
        options: {}
      },
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [250, 300]
    },
    {
      parameters: {
        calendar: {
          __rl: true,
          value: "primary",
          mode: "list"
        },
        returnAll: true,
        options: {
          timeMin: "={{ $json.startDate }}",
          timeMax: "={{ $json.endDate }}"
        }
      },
      name: "Google Calendar",
      type: "n8n-nodes-base.googleCalendar",
      typeVersion: 1,
      position: [450, 300],
      credentials: {
        googleCalendarOAuth2Api: {
          id: "1",
          name: "Google Calendar account"
        }
      }
    },
    {
      parameters: {
        url: "={{ $env.SUPABASE_URL }}/rest/v1/calendar_events",
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "apikey",
              value: "={{ $env.SUPABASE_ANON_KEY }}"
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
              name: "event_id",
              value: "={{ $json.id }}"
            },
            {
              name: "summary",
              value: "={{ $json.summary }}"
            },
            {
              name: "description",
              value: "={{ $json.description }}"
            },
            {
              name: "start_time",
              value: "={{ $json.start.dateTime || $json.start.date }}"
            },
            {
              name: "end_time",
              value: "={{ $json.end.dateTime || $json.end.date }}"
            },
            {
              name: "location",
              value: "={{ $json.location }}"
            },
            {
              name: "attendees",
              value: "={{ JSON.stringify($json.attendees) }}"
            },
            {
              name: "raw_data",
              value: "={{ JSON.stringify($json) }}"
            }
          ]
        },
        options: {}
      },
      name: "Save to Supabase",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 3,
      position: [650, 300]
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
              value: "Calendar events synced successfully"
            }
          ],
          number: [
            {
              name: "eventsCount",
              value: "={{ $items().length }}"
            }
          ]
        },
        options: {}
      },
      name: "Response",
      type: "n8n-nodes-base.set",
      typeVersion: 1,
      position: [850, 300]
    }
  ],
  connections: {
    "Webhook": {
      "main": [
        [
          {
            "node": "Google Calendar",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Calendar": {
      "main": [
        [
          {
            "node": "Save to Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Save to Supabase": {
      "main": [
        [
          {
            "node": "Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

// ミーティング分析ワークフローの定義
const meetingAnalysisWorkflow = {
  name: "Meeting Analysis",
  active: true,
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "analyze-meeting",
        options: {}
      },
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [250, 300]
    },
    {
      parameters: {
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        authentication: "genericCredentialType",
        genericAuthType: "httpQueryAuth",
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: "key",
              value: "={{ $env.GEMINI_API_KEY }}"
            }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "contents",
              value: JSON.stringify([{
                parts: [{
                  text: "以下のミーティング情報を分析してください：\n\nタイトル: {{ $json.title }}\n説明: {{ $json.description }}\n参加者: {{ $json.attendees }}\n\n以下の観点で分析してください：\n1. ミーティングの目的と重要度\n2. 準備が必要な事項\n3. 想定される議論ポイント\n4. フォローアップが必要な可能性"
                }]
              }])
            }
          ]
        },
        options: {}
      },
      name: "Gemini Analysis",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 3,
      position: [450, 300]
    },
    {
      parameters: {
        url: "={{ $env.SUPABASE_URL }}/rest/v1/meeting_analysis",
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "apikey",
              value: "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              name: "Content-Type",
              value: "application/json"
            }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "meeting_id",
              value: "={{ $json.meeting_id }}"
            },
            {
              name: "analysis",
              value: "={{ $json.candidates[0].content.parts[0].text }}"
            },
            {
              name: "analyzed_at",
              value: "={{ new Date().toISOString() }}"
            }
          ]
        },
        options: {}
      },
      name: "Save Analysis",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 3,
      position: [650, 300]
    }
  ],
  connections: {
    "Webhook": {
      "main": [
        [
          {
            "node": "Gemini Analysis",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gemini Analysis": {
      "main": [
        [
          {
            "node": "Save Analysis",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

// N8N APIでワークフローを作成
async function createWorkflow(workflow) {
  const n8nUrl = process.env.N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    console.error('❌ N8N_URL または N8N_API_KEY が設定されていません');
    return false;
  }

  return new Promise((resolve) => {
    const url = new URL('/api/v1/workflows', n8nUrl);
    const data = JSON.stringify(workflow);

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
          console.log(`✅ ワークフロー "${workflow.name}" を作成しました (ID: ${result.id})`);
          resolve(true);
        } else {
          console.error(`❌ ワークフロー "${workflow.name}" の作成に失敗しました (Status: ${res.statusCode})`);
          console.error(`   詳細: ${responseData}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ワークフロー "${workflow.name}" の作成エラー:`, err.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 既存のワークフローを取得
async function getWorkflows() {
  const n8nUrl = process.env.N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  return new Promise((resolve) => {
    const url = new URL('/api/v1/workflows', n8nUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const workflows = JSON.parse(data);
          resolve(workflows.data || []);
        } else {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

// メイン処理
async function main() {
  console.log('🚀 N8Nワークフローセットアップ開始\n');

  // 既存のワークフローをチェック
  const existingWorkflows = await getWorkflows();
  const existingNames = existingWorkflows.map(w => w.name);

  console.log(`📋 既存のワークフロー数: ${existingWorkflows.length}`);

  // カレンダー同期ワークフローをチェック・作成
  if (!existingNames.includes(calendarSyncWorkflow.name)) {
    console.log(`\n📅 "${calendarSyncWorkflow.name}" ワークフローを作成中...`);
    await createWorkflow(calendarSyncWorkflow);
  } else {
    console.log(`✓ "${calendarSyncWorkflow.name}" は既に存在します`);
  }

  // ミーティング分析ワークフローをチェック・作成
  if (!existingNames.includes(meetingAnalysisWorkflow.name)) {
    console.log(`\n🔍 "${meetingAnalysisWorkflow.name}" ワークフローを作成中...`);
    await createWorkflow(meetingAnalysisWorkflow);
  } else {
    console.log(`✓ "${meetingAnalysisWorkflow.name}" は既に存在します`);
  }

  // ワークフロー定義をファイルに保存
  console.log('\n📁 ワークフロー定義をファイルに保存中...');

  if (!fs.existsSync('n8n-workflows')) {
    fs.mkdirSync('n8n-workflows');
  }

  fs.writeFileSync(
    'n8n-workflows/calendar-sync-workflow.json',
    JSON.stringify(calendarSyncWorkflow, null, 2)
  );

  fs.writeFileSync(
    'n8n-workflows/meeting-analysis-workflow.json',
    JSON.stringify(meetingAnalysisWorkflow, null, 2)
  );

  console.log('✅ ワークフロー定義を保存しました');
  console.log('\n✨ N8Nワークフローセットアップ完了！');
  console.log('\n💡 次のステップ:');
  console.log('1. N8Nダッシュボードで Google Calendar の認証を設定してください');
  console.log('2. 各ワークフローのWebhook URLを確認してください');
  console.log('3. 必要に応じてワークフローをカスタマイズしてください');
}

// 実行
main().catch(console.error);