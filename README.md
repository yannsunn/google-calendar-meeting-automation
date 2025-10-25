# 📅 Googleカレンダータスク通知システム

AI駆動の会議提案資料自動生成システム

## ✨ 機能

- **Google認証**: Googleアカウントでセキュアログイン
- **会議データ管理**: Supabaseからリアルタイムで会議情報を取得
- **AI提案生成**: Gemini APIで高品質な提案内容を自動生成
- **スライド作成**: Google Apps Scriptで自動的にGoogleスライドを生成
- **プレビュー機能**: 生成前に提案内容を確認

## 🚀 クイックスタート

### 1. 環境変数設定

`.env.local` を作成：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_random_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Apps Script
GAS_SLIDE_GENERATOR_URL=your_gas_url
```

### 2. インストールと起動

```bash
cd web
npm install
npm run dev
```

### 3. Google Apps Script設定

1. https://script.google.com にアクセス
2. 新規プロジェクト作成
3. `gas-slide-generator/Code.gs` の内容をコピー
4. デプロイ → ウェブアプリとして公開
5. URLを `GAS_SLIDE_GENERATOR_URL` に設定

## 📁 プロジェクト構造

```
├── web/                      # Next.js アプリケーション
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/      # Reactコンポーネント
│   │   └── lib/            # ユーティリティ
│   └── package.json
├── gas-slide-generator/     # Google Apps Script
│   └── Code.gs             # スライド生成スクリプト
└── .env                    # 環境変数

```

## 🔧 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript, Material UI
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **認証**: NextAuth.js (Google OAuth)
- **スライド生成**: Google Apps Script
- **デプロイ**: Vercel

## 🔒 セキュリティ

- **認証**: Google OAuth 2.0
- **CSP**: Content Security Policy 実装
- **HSTS**: Strict Transport Security 有効
- **入力検証**: Zodによるスキーマ検証
- **レート制限**: API保護

## 📝 使い方

1. **ログイン**: Googleアカウントでログイン
2. **会議選択**: ダッシュボードから会議を選択
3. **プレビュー**: 「プレビュー生成」で内容確認
4. **スライド生成**: 「提案資料を生成」でGoogleスライド作成

## 🐛 トラブルシューティング

### ログインできない
- Google Cloud ConsoleでリダイレクトURIを確認
- `NEXTAUTH_URL` が正しく設定されているか確認

### スライドが生成されない
- `GAS_SLIDE_GENERATOR_URL` が設定されているか確認
- Google Apps Scriptの実行権限を確認

### プレビューが表示されない
- `GEMINI_API_KEY` が有効か確認
- Gemini API利用制限を確認

## 📄 ライセンス

MIT

## 👤 作成者

yannsunn1116@gmail.com

---

最終更新: 2025-10-25