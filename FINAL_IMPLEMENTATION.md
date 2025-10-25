# 📋 Google カレンダータスク通知システム - 最終実装仕様書

## 🎯 システム概要

このシステムは、Googleカレンダーの会議情報から自動的にDX推進提案資料を生成し、会議の3時間前にメールで通知するシステムです。

## 🏗️ システム構成

### 1. フロントエンド (Next.js)
- **URL**: https://calendar-yasuus-projects.vercel.app
- **主要ページ**:
  - `/` - ダッシュボード（会議一覧表示）
  - `/proposals` - 提案資料生成ページ
  - `/auth/signin` - ログインページ

### 2. バックエンド API
- **使用中のAPIエンドポイント**:
  - `/api/auth/[...nextauth]` - Google OAuth認証
  - `/api/meetings` - 会議データ取得（Supabase経由）
  - `/api/generate-proposal` - 提案資料生成（プレビュー/本番）
  - `/api/calendar/sync` - カレンダー同期
  - `/api/calendar/events` - カレンダーイベント取得

### 3. データベース (Supabase)
- **URL**: https://dpqsipbppdemgfwuihjr.supabase.co
- **主要テーブル**: `calendar_events`
  - 115件のイベントが保存済み

### 4. N8N ワークフロー
- **URL**: https://n8n.srv946785.hstgr.cloud
- **ワークフローID**: `8TEr2nh72kUUntx3`
- **Webhook**: `/webhook/generate-proposal`
- **機能**:
  - Gemini APIで提案内容生成
  - Google Slidesプレゼンテーション作成
  - メール通知（3時間前）

### 5. Google Apps Script (スライド生成)
- **ファイル**: `gas-slide-generator/Code.gs`
- **機能**: N8NからのJSONデータを受け取り、Googleスライドを生成

## 🚀 主要機能

### 1. 会議一覧表示
- Supabase REST APIから会議データを取得
- 15分以上の会議のみ表示
- チェックボックスで選択可能

### 2. 提案資料生成
#### プレビューモード
- Gemini APIを直接呼び出し
- 即座に提案内容を表示
- Google OAuthトークンの期限切れの影響を受けない

#### 本番モード
- N8N Webhookを経由
- Google Slidesを自動生成
- 会議3時間前にメール通知
- ⚠️ **現在Google OAuthトークンが期限切れ**

### 3. 認証
- Google OAuth 2.0
- 許可ユーザー: `yannsunn1116@gmail.com`

## 🔧 環境変数

### 必須の環境変数（Vercel）
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=[Supabase URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase匿名キー]

# N8N
N8N_API_KEY=[N8N APIキー]
N8N_URL=https://n8n.srv946785.hstgr.cloud

# Gemini AI
GEMINI_API_KEY=[Gemini APIキー]

# NextAuth
NEXTAUTH_URL=https://calendar-yasuus-projects.vercel.app
NEXTAUTH_SECRET=[ランダムな文字列]

# Google OAuth
GOOGLE_CLIENT_ID=[Google OAuth クライアントID]
GOOGLE_CLIENT_SECRET=[Google OAuth クライアントシークレット]
GOOGLE_REDIRECT_URI=https://calendar-yasuus-projects.vercel.app/api/auth/callback/google
```

## 📁 プロジェクト構造

```
/
├── web/                         # Next.js アプリケーション
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/           # APIエンドポイント
│   │   │   │   ├── auth/      # 認証
│   │   │   │   ├── calendar/  # カレンダー同期
│   │   │   │   ├── meetings/  # 会議データ
│   │   │   │   └── generate-proposal/  # 提案生成
│   │   │   ├── proposals/     # 提案資料ページ
│   │   │   └── page.tsx       # ダッシュボード
│   │   └── components/         # Reactコンポーネント
│   └── package.json
├── gas-slide-generator/         # Google Apps Script
│   └── Code.gs                # スライド生成スクリプト
└── PREVIEW_MODE_FIX.md        # プレビューモード修正履歴
```

## 🐛 既知の問題と対処法

### 1. Google OAuth トークン期限切れ
**問題**: N8Nワークフローでの通常モード（スライド生成）が動作しない
**対処法**:
1. N8N管理画面にログイン
2. Google Calendar ノードで再認証
3. ワークフローを保存・有効化

### 2. チェックボックスの動作
**解決済み**:
- 初期状態で何も選択されていない
- 選択した会議のみ処理される
- 404エラーは発生しない

## 🎨 使用方法

### 1. 提案資料のプレビュー
1. https://calendar-yasuus-projects.vercel.app/proposals にアクセス
2. 会議を1件選択
3. 「プレビュー生成（1件のみ）」をクリック
4. 提案内容が表示される

### 2. 提案資料の本格生成
1. 会議を選択（複数可）
2. 企業URLを追加（オプション）
3. 「提案資料を生成」をクリック
4. 3時間前にメール通知

## 🔐 セキュリティ

- Google OAuth認証必須
- 許可ユーザーのみアクセス可能
- 環境変数はVercelで暗号化保存
- APIキーは公開リポジトリに含まれない

## 📝 メンテナンス

### 定期的な確認事項
1. Google OAuthトークンの有効性
2. N8N APIキーの有効期限
3. Supabaseのストレージ容量
4. Vercelのデプロイ状況

### トラブルシューティング
- **ログイン不可**: Google Cloud ConsoleでリダイレクトURIを確認
- **会議が表示されない**: Supabase接続を確認
- **提案生成エラー**: Gemini APIキーを確認
- **スライド生成エラー**: N8NのGoogle認証を更新

## 🚦 現在のステータス

✅ **動作中**:
- プレビューモード（Gemini API直接呼び出し）
- 会議一覧表示
- Google OAuth認証
- Supabaseデータ取得

⚠️ **要対応**:
- N8N Google OAuthトークン更新（スライド生成用）

❌ **削除済み**:
- 不要なAPIエンドポイント
- テスト用スクリプト
- 一時ファイル

---

**最終更新**: 2025-10-25
**バージョン**: 1.0.0
**作成者**: Claude Code & yannsunn1116@gmail.com