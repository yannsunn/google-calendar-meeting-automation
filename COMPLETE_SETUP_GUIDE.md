# 📚 完全セットアップガイド

このガイドは、Google Calendar Meeting Automationシステムを最初から最後まで設定するための完全なガイドです。

## 📋 目次
1. [クイックスタート](#クイックスタート)
2. [環境変数の設定](#環境変数の設定)
3. [N8N APIキーの取得](#n8n-apiキーの取得)
4. [データベース設定](#データベース設定supabase)
5. [デプロイ手順](#デプロイ手順)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 🚀 クイックスタート

### 必要なもの
- Googleアカウント
- Vercelアカウント
- Supabaseアカウント（無料）

### 10分でセットアップ
1. `.env.template`を`.env`にコピー
2. 必須項目を設定（5つだけ）
3. Vercelにデプロイ

---

## 🔑 環境変数の設定

### 最小限必要な環境変数（5つ）

```bash
# 1. データベース
DATABASE_URL=（Supabaseから取得）

# 2. N8N API
N8N_API_KEY=（N8N管理画面から取得）

# 3. Google OAuth
GOOGLE_CLIENT_ID=（Google Cloudから取得）
GOOGLE_CLIENT_SECRET=（Google Cloudから取得）

# 4. AI
GEMINI_API_KEY=（Google MakerSuiteから取得）

# 5. セキュリティ（ランダム生成）
NEXTAUTH_SECRET=（openssl rand -hex 32）
```

### 設定場所
**Vercel Dashboard** > Settings > Environment Variables

---

## 🔐 N8N APIキーの取得

### 手順
1. **N8N管理画面にアクセス**
   ```
   https://n8n.srv946785.hstgr.cloud
   ```

2. **APIを有効化**
   - Settings → API
   - API Enabled: ON

3. **APIキー生成**
   - Generate API Key クリック
   - キーをコピー（一度だけ表示）

4. **環境変数に設定**
   ```
   N8N_API_KEY=コピーしたキー
   ```

### APIキーで可能になること
- ✅ ワークフロー管理
- ✅ 実行状態監視
- ✅ 履歴確認
- ✅ リモート実行

---

## 🗄️ データベース設定（Supabase）

### 手順
1. **Supabaseプロジェクト作成**
   - https://supabase.com
   - New Project → 名前とパスワード設定

2. **データベース初期化**
   - SQL Editor開く
   - `/database/init.sql`の内容を貼り付け
   - Run実行

3. **接続URLコピー**
   - Settings → Database
   - Connection string (URI)をコピー

4. **環境変数に設定**
   ```
   DATABASE_URL=コピーしたURL
   ```

---

## 🌐 Google OAuth設定

### 手順
1. **Google Cloud Console**
   - https://console.cloud.google.com
   - 新規プロジェクト作成

2. **APIを有効化**
   - APIライブラリ
   - Google Calendar API → 有効化
   - Google Slides API → 有効化

3. **OAuth認証情報作成**
   - 認証情報 → 作成 → OAuth クライアント ID
   - アプリケーションの種類: ウェブアプリケーション
   - リダイレクトURI追加:
     ```
     https://web-kxbzxubh3-yasuus-projects.vercel.app/api/auth/google/callback
     ```

4. **クライアントIDとシークレット取得**
   - 作成後、IDとシークレットをコピー

---

## 🤖 AI API設定

### Gemini API（必須）
1. **Google MakerSuite**
   - https://makersuite.google.com/app/apikey
   - Get API key → Create API key

2. **環境変数に設定**
   ```
   GEMINI_API_KEY=取得したキー
   ```

### Claude API（オプション）
1. **Anthropic Console**
   - https://console.anthropic.com
   - API Keys → Create Key

---

## 🚀 デプロイ手順

### 方法1: Vercel Dashboard（推奨）
1. **Import Git Repository**
   - https://vercel.com/import
   - GitHubリポジトリを選択

2. **環境変数設定**
   - Configure Project
   - Environment Variablesに必須項目を追加

3. **Deploy**

### 方法2: Vercel CLI
```bash
cd web
vercel --prod
```

---

## ✅ 動作確認

### 1. アプリケーションアクセス
```
https://web-kxbzxubh3-yasuus-projects.vercel.app
```

### 2. N8N連携確認
- ダッシュボードにN8Nステータスが表示
- エラーがある場合は設定ガイドが表示

### 3. Google認証テスト
- ログインボタンクリック
- Googleアカウントで認証

---

## 🔧 トラブルシューティング

### よくあるエラーと解決方法

#### "N8N_API_KEY is not configured"
→ 環境変数が未設定。Vercelダッシュボードで設定

#### "Database connection failed"
→ DATABASE_URLが間違っている。Supabaseから再取得

#### "Google authentication error"
→ リダイレクトURIが一致しない。Google Cloudで確認

#### ビルドエラー
→ 依存関係の問題。`npm install`実行

### デバッグコマンド
```bash
# ログ確認
vercel logs [deployment-url]

# 環境変数確認
vercel env ls

# 再デプロイ
vercel --prod --force
```

---

## 📞 サポート

### リソース
- **GitHub Issues**: https://github.com/yannsunn/google-calendar-meeting-automation/issues
- **N8N Forum**: https://community.n8n.io
- **Vercel Support**: https://vercel.com/support

### 更新情報
- **最終更新**: 2024年9月
- **バージョン**: 1.0.0
- **動作確認済み環境**: Node.js 18+, Next.js 14

---

## 🎉 セットアップ完了！

すべての設定が完了したら：
1. ダッシュボードで会議一覧を確認
2. N8Nワークフロー状態を監視
3. 提案資料の自動生成をテスト

お疲れさまでした！システムの利用を開始できます。