# セットアップガイド - Google Calendar Meeting Automation

## 1. デプロイ済みURL

- **Vercel App**: https://web-kxbzxubh3-yasuus-projects.vercel.app
- **GitHub Repository**: https://github.com/yannsunn/google-calendar-meeting-automation
- **N8N**: https://n8n.srv946785.hstgr.cloud

## 2. 環境変数の設定方法

### Vercel Dashboard での設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. `web` プロジェクトを選択
3. Settings → Environment Variables に移動
4. 以下の環境変数を追加：

```bash
# 必須設定項目

# データベース (Supabase, Neon, PlanetScaleなどを使用)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# N8N設定
N8N_URL=https://n8n.srv946785.hstgr.cloud
N8N_WEBHOOK_BASE_URL=https://n8n.srv946785.hstgr.cloud/webhook
N8N_API_KEY=your_n8n_api_key

# Google APIs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://web-kxbzxubh3-yasuus-projects.vercel.app/api/auth/google/callback

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
CLAUDE_API_KEY=your_claude_api_key

# 検索API (どちらか1つ)
SERPER_API_KEY=your_serper_api_key
# または
BRAVE_SEARCH_API_KEY=your_brave_search_api_key

# セキュリティ設定 (ランダムな文字列に変更)
JWT_SECRET=generate_random_string_here
SESSION_SECRET=generate_random_string_here
NEXTAUTH_SECRET=generate_random_string_here
NEXTAUTH_URL=https://web-kxbzxubh3-yasuus-projects.vercel.app

# Redis (Upstash Redis推奨)
REDIS_URL=redis://default:password@your-redis-host:6379
```

## 3. APIキーの取得方法

### Google Cloud Console
1. https://console.cloud.google.com にアクセス
2. 新規プロジェクトを作成
3. APIとサービス → 認証情報 → OAuth 2.0 クライアント ID を作成
4. Calendar API, Slides API を有効化
5. リダイレクトURIに `https://web-kxbzxubh3-yasuus-projects.vercel.app/api/auth/google/callback` を追加

### Gemini API
1. https://makersuite.google.com にアクセス
2. Get API key をクリック
3. Create API key in new project を選択

### Claude API
1. https://console.anthropic.com にアクセス
2. API Keys → Create Key

### Serper API
1. https://serper.dev にアクセス
2. Sign up → API Key を取得

### Upstash Redis (推奨)
1. https://upstash.com にアクセス
2. Create Database
3. Redis タブから接続URLをコピー

## 4. N8N ワークフローの設定

### N8N にログイン
1. https://n8n.srv946785.hstgr.cloud にアクセス
2. 管理者アカウントでログイン

### ワークフローのインポート
1. Workflows → Import from File
2. 以下のファイルをインポート：
   - `n8n-workflows/daily-meeting-sync.json`
   - `n8n-workflows/company-research-workflow.json`

### 認証情報の設定
各ワークフローで以下の認証情報を設定：
- Google Calendar OAuth2
- Google Slides OAuth2
- PostgreSQL接続
- Gemini/Claude API
- Serper/Brave Search API

## 5. データベースの設定

### Supabase を使用する場合（推奨）
1. https://supabase.com で新規プロジェクト作成
2. SQL Editor で `database/init.sql` を実行
3. Settings → Database → Connection string をコピー

### その他のオプション
- Neon: https://neon.tech
- PlanetScale: https://planetscale.com
- Vercel Postgres: Vercel Dashboard から作成可能

## 6. 動作確認

### 基本機能の確認
1. https://web-kxbzxubh3-yasuus-projects.vercel.app にアクセス
2. Google アカウントでログイン
3. カレンダー連携を確認

### N8N ワークフローのテスト
1. N8N で daily-meeting-sync ワークフローを手動実行
2. データベースに会議情報が保存されることを確認
3. Web UIに反映されることを確認

## 7. トラブルシューティング

### よくある問題

**Q: データベース接続エラー**
- DATABASE_URL が正しく設定されているか確認
- SSL設定が必要な場合: `?sslmode=require` を追加

**Q: Google認証エラー**
- リダイレクトURIが正しいか確認
- OAuth同意画面の設定を確認

**Q: N8N ワークフロー実行エラー**
- Webhook URLが正しく設定されているか確認
- N8N の認証情報を再設定

## 8. セキュリティ設定

本番環境では以下を必ず実施：
1. すべてのシークレットキーを安全な値に変更
2. CORS設定を適切に構成
3. Rate limiting を設定
4. ログ監視を有効化

## 9. サポート

問題が発生した場合：
- GitHub Issues: https://github.com/yannsunn/google-calendar-meeting-automation/issues
- ドキュメント: このREADMEを参照

## 次のステップ

1. 環境変数をVercelに設定
2. N8Nワークフローをインポート・設定
3. Google OAuth認証を設定
4. データベースを初期化
5. 動作確認テストを実施