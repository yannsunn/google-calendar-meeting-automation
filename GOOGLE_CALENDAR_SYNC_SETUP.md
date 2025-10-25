# Google Calendar 同期の再設定手順

## 🔄 Google Calendar同期を再有効化する方法

### 前提条件
- Google Cloud ConsoleでOAuth 2.0クライアントIDが設定済み
- カレンダーAPIが有効化済み

### 手順

#### 1. OAuth認証スクリプトの作成

`web/scripts/setup-calendar-auth.js` を作成：

```javascript
const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback/google'
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 認証URLを生成
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('以下のURLにアクセスして認証してください：');
console.log(authUrl);

rl.question('認証後のコードを入力してください: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    // トークンを環境変数ファイルに保存
    const envContent = `
# Google Calendar OAuth Tokens (更新日: ${new Date().toISOString()})
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
`;

    // .env.localに追記
    fs.appendFileSync('.env.local', envContent);

    console.log('✅ トークンが保存されました');
    console.log('Refresh Token:', tokens.refresh_token);

  } catch (error) {
    console.error('❌ エラー:', error);
  }

  rl.close();
});
```

#### 2. スクリプトを実行

```bash
cd web
node scripts/setup-calendar-auth.js
```

#### 3. Calendar同期APIを有効化

`web/src/app/api/calendar/sync/route.ts` を修正：

```typescript
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // リフレッシュトークンを設定
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    return oauth2Client;
  }

  throw new Error('Google Calendar sync is not configured. Please set up OAuth tokens.');
}
```

#### 4. 定期同期の設定（オプション）

Vercelのcron jobまたは外部スケジューラーで定期的に同期：

```typescript
// pages/api/cron/sync-calendar.ts
export default async function handler(req, res) {
  // Vercel Cronのセキュリティチェック
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // カレンダー同期を実行
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/calendar/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ days: 7 }),
  });

  const result = await response.json();
  return res.status(200).json(result);
}
```

`vercel.json` に追加：
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-calendar",
      "schedule": "0 */6 * * *"  // 6時間ごと
    }
  ]
}
```

## 🎯 推奨事項

### 現在のシステムの動作確認

1. **まずSupabaseのテストデータで確認**
   - 上記のSQLを実行
   - システムが正常に動作することを確認

2. **必要に応じてGoogle Calendar同期を追加**
   - リアルタイムのカレンダーデータが必要な場合のみ
   - 手動同期ボタンを追加することも可能

### メリット・デメリット

#### Supabaseのみ使用（現在）
✅ シンプルで安定
✅ トークン管理不要
❌ 手動でデータ入力が必要

#### Google Calendar同期を追加
✅ 自動的に最新のカレンダーデータ
❌ トークン管理が必要
❌ 定期的な再認証が必要な場合がある

---

**作成日**: 2025-10-25