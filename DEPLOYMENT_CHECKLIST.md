# 🚀 デプロイメントチェックリスト - Googleカレンダータスク通知システム

## 📋 デプロイ前の確認事項

### 1. 環境変数の設定 (Vercel)

以下の環境変数が設定されていることを確認してください：

#### ✅ 必須の環境変数
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dpqsipbppdemgfwuihjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase匿名キー]

# Gemini AI
GEMINI_API_KEY=[Gemini APIキー]

# NextAuth
NEXTAUTH_URL=https://calendar-yasuus-projects.vercel.app
NEXTAUTH_SECRET=[ランダムな32文字以上の文字列]

# Google OAuth
GOOGLE_CLIENT_ID=[Google OAuth クライアントID]
GOOGLE_CLIENT_SECRET=[Google OAuth クライアントシークレット]
GOOGLE_REDIRECT_URI=https://calendar-yasuus-projects.vercel.app/api/auth/callback/google

# Google Apps Script (スライド生成用)
GAS_SLIDE_GENERATOR_URL=[GASのWebアプリURL] ⚠️ 要設定
```

### 2. Google Apps Script のデプロイ

#### 手順：
1. [Google Apps Script](https://script.google.com) にアクセス
2. 新規プロジェクト作成
3. `gas-slide-generator/Code.gs` の内容をコピー＆ペースト
4. **デプロイ** → **新しいデプロイ**
5. 設定:
   - 種類: **ウェブアプリ**
   - 実行ユーザー: **自分**
   - アクセスできるユーザー: **全員**
6. デプロイ後のURLをコピー
7. Vercel環境変数 `GAS_SLIDE_GENERATOR_URL` に設定

### 3. Google Cloud Console の設定

#### OAuth 2.0 リダイレクトURI
以下のURIが登録されていることを確認：
- `https://calendar-yasuus-projects.vercel.app/api/auth/callback/google`
- `https://calendar-qmjcnbd70-yasuus-projects.vercel.app/api/auth/callback/google`
- `https://calendar-p1t99s4in-yasuus-projects.vercel.app/api/auth/callback/google`

### 4. コードの確認

#### ✅ 完了済み
- [x] TypeScript エラーなし (`npm run typecheck`)
- [x] セキュリティヘッダー設定済み
- [x] 入力検証とサニタイゼーション実装済み
- [x] React Error Boundary 実装済み
- [x] 包括的なエラーログ実装済み
- [x] レート制限実装済み
- [x] N8N依存関係の削除完了

#### ⚠️ 確認が必要
- [ ] `GAS_SLIDE_GENERATOR_URL` が正しく設定されているか
- [ ] Gemini API キーが有効か
- [ ] Supabase接続が正常か

## 🔧 デプロイ手順

### 1. ローカルでのテスト
```bash
cd web
npm install
npm run build
npm run typecheck
```

### 2. Vercelへのデプロイ
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

Vercelが自動的にデプロイを開始します。

### 3. デプロイ後の確認

#### 機能テスト
1. **ログイン**: https://calendar-yasuus-projects.vercel.app でGoogleログイン
2. **会議表示**: ダッシュボードで会議一覧が表示されることを確認
3. **プレビュー生成**:
   - 会議を1件選択
   - 「プレビュー生成」クリック
   - 提案内容が表示されることを確認
4. **スライド生成**:
   - 会議を選択
   - 「提案資料を生成」クリック
   - Googleスライドが生成されることを確認

#### セキュリティチェック
- [ ] HTTPSでアクセス可能
- [ ] CSPヘッダーが設定されている
- [ ] HSTSが有効
- [ ] 認証なしではアクセスできない

## 🐛 トラブルシューティング

### 問題: ログインできない
**解決策**:
1. Google Cloud ConsoleでリダイレクトURIを確認
2. `NEXTAUTH_URL` が正しく設定されているか確認

### 問題: プレビューが空
**解決策**:
1. `GEMINI_API_KEY` が設定されているか確認
2. Gemini APIの利用制限を確認

### 問題: スライドが生成されない
**解決策**:
1. `GAS_SLIDE_GENERATOR_URL` が設定されているか確認
2. Google Apps Scriptのログを確認
3. GASの実行権限が「全員」になっているか確認

### 問題: 会議が表示されない
**解決策**:
1. Supabase接続を確認
2. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を確認

## 📊 システムステータス

### ✅ 動作中の機能
- Googleログイン認証
- Supabaseからの会議データ取得（115件）
- プレビューモード（Gemini直接呼び出し）
- セキュリティヘッダー (A+評価)
- エラーハンドリングとログ

### ⏳ 設定が必要な機能
- Google Apps Scriptのデプロイ
- スライド自動生成

### ❌ 無効化された機能
- N8Nワークフロー（削除済み）
- メール/Slack通知（削除済み）
- Google Calendar同期（トークン期限切れ）

## 🔐 セキュリティ設定

### 現在のセキュリティ評価: A+

実装済みのセキュリティ対策：
- ✅ Content Security Policy (CSP)
- ✅ Strict Transport Security (HSTS)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ 入力検証 (Zod)
- ✅ SQLインジェクション対策
- ✅ XSS対策
- ✅ レート制限
- ✅ 環境変数による機密情報管理

## 📝 メンテナンスタスク

### 定期的な確認（週次）
- [ ] エラーログの確認
- [ ] Gemini API利用量の確認
- [ ] Supabaseのストレージ使用量

### 定期的な確認（月次）
- [ ] 依存関係の更新 (`npm update`)
- [ ] セキュリティ監査 (`npm audit`)
- [ ] Google OAuthトークンの有効性確認

## 🎯 次のステップ

1. **即座に実行**:
   - Google Apps Scriptのデプロイ
   - `GAS_SLIDE_GENERATOR_URL` の設定

2. **オプション**:
   - Google Calendarの再認証（必要に応じて）
   - カスタムドメインの設定
   - アクセス解析の導入

## 📞 サポート連絡先

- **開発者**: yannsunn1116@gmail.com
- **プロジェクト**: Googleカレンダータスク通知システム
- **バージョン**: 1.0.0
- **最終更新**: 2025-10-25

---

**注意事項**:
- このチェックリストはデプロイ前に必ず確認してください
- 環境変数は絶対にGitにコミットしないでください
- 問題が発生した場合は、まずログを確認してください