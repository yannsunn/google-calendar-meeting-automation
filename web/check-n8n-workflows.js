#!/usr/bin/env node
const https = require('https');
require('dotenv').config();

// N8N APIでワークフローを取得
async function getWorkflows() {
  const n8nUrl = process.env.N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    console.error('❌ N8N_URL または N8N_API_KEY が設定されていません');
    return;
  }

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
          console.log('📋 N8Nワークフロー一覧:');
          console.log('========================');

          if (workflows.data && workflows.data.length > 0) {
            workflows.data.forEach(wf => {
              console.log(`\n📌 ${wf.name}`);
              console.log(`   ID: ${wf.id}`);
              console.log(`   Active: ${wf.active ? '✅' : '❌'}`);
              console.log(`   作成日: ${wf.createdAt}`);
              console.log(`   更新日: ${wf.updatedAt}`);

              // Webhook URLを探す
              if (wf.nodes) {
                const webhooks = wf.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
                if (webhooks.length > 0) {
                  webhooks.forEach(webhook => {
                    const path = webhook.parameters?.path || 'undefined';
                    console.log(`   Webhook Path: /webhook/${wf.id}/${path}`);
                  });
                }
              }
            });
          } else {
            console.log('ワークフローが見つかりません');
          }

          resolve(workflows.data || []);
        } else {
          console.error(`❌ APIエラー (Status: ${res.statusCode})`);
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ 接続エラー:', err.message);
      resolve([]);
    });

    req.end();
  });
}

// メイン処理
async function main() {
  console.log('🚀 N8Nワークフロー確認\n');
  await getWorkflows();

  console.log('\n\n💡 Google Calendar同期を実行するには:');
  console.log('1. N8Nダッシュボードでワークフローを作成');
  console.log('2. Google Calendar認証を設定');
  console.log('3. Webhook URLを確認してテスト実行');
}

main().catch(console.error);