# 🔒 N8Nワークフロー セキュリティガイド

## ⚠️ 重要: セキュリティ問題と修正方法

### 発見された重大な問題

元のワークフローに以下の**クリティカルなセキュリティ問題**が見つかりました：

#### 🔴 問題1: ハードコードされたGoogle OAuthトークン

**場所**: `Google Calendar API` ノード
```json
{
  "name": "Authorization",
  "value": "Bearer ya29.a0AQQ_BDT-rHVy8h6vbiTB8Rir1n2Dt5oZhejJaiv..."
}
```

**リスク**:
- このトークンでGoogleカレンダーへの完全アクセスが可能
- ワークフローを見た人全員がアクセス権を取得
- トークンの有効期限切れ時に手動更新が必要

**修正方法**: N8Nの認証機能を使用
```json
{
  "name": "Google Calendar",
  "type": "n8n-nodes-base.googleCalendar",
  "credentials": {
    "googleCalendarOAuth2Api": {
      "id": "YOUR_CREDENTIAL_ID",
      "name": "Google Calendar OAuth2"
    }
  }
}
```

---

#### 🔴 問題2: ハードコードされたSupabase APIキー

**場所**: `Supabase保存` ノード、`提案保存` ノード
```json
{
  "name": "apikey",
  "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
},
{
  "name": "Authorization",
  "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**リスク**:
- データベースへの不正アクセス
- データの改ざん・削除
- 個人情報の漏洩

**修正方法**: N8NのSupabaseクレデンシャルを使用
```json
{
  "name": "Supabase: Save Events",
  "type": "n8n-nodes-base.supabase",
  "credentials": {
    "supabaseApi": {
      "id": "YOUR_SUPABASE_CREDENTIAL_ID",
      "name": "Supabase"
    }
  }
}
```

---

## ✅ セキュアなワークフローの設定手順

### ステップ1: Google Calendar認証の設定

1. **N8N管理画面**にアクセス
2. **Credentials** → **Create New** をクリック
3. **Google Calendar OAuth2 API** を選択
4. 以下の情報を入力:
   ```
   Client ID: YOUR_GOOGLE_CLIENT_ID
   Client Secret: YOUR_GOOGLE_CLIENT_SECRET
   ```
5. **OAuth Redirect URL** をGoogleで設定
6. **Connect my account** をクリックして認証

### ステップ2: Supabase認証の設定

1. **N8N管理画面** → **Credentials**
2. **Supabase** を選択
3. 以下を入力:
   ```
   Host: https://dpqsipbppdemgfwuihjr.supabase.co
   Service Role Secret: YOUR_SERVICE_ROLE_KEY
   ```
4. **Save** をクリック

### ステップ3: OpenAI認証の設定

1. **Credentials** → **OpenAI**
2. API Keyを入力
3. **Save**

### ステップ4: セキュアなワークフローをインポート

1. `secured-calendar-sync-workflow.json` を開く
2. 以下のプレースホルダーを実際のIDに置換:
   ```
   YOUR_GOOGLE_CREDENTIAL_ID → Google認証のID
   YOUR_SUPABASE_CREDENTIAL_ID → Supabase認証のID
   YOUR_OPENAI_CREDENTIAL_ID → OpenAI認証のID
   ```
3. N8Nにインポート

---

## 🔐 ベストプラクティス

### 1. クレデンシャルの管理

**❌ 絶対にしないこと**:
- APIキーやトークンをワークフローに直接記述
- パスワードを平文で保存
- クレデンシャルをGitにコミット

**✅ すべきこと**:
- N8Nのクレデンシャル機能を使用
- 環境変数でシークレットを管理
- アクセス権限を最小限に制限

### 2. アクセス制御

```javascript
// 環境変数から内部ドメインを取得
const internalDomains = (process.env.INTERNAL_DOMAINS || 'gmail.com').split(',');

// ハードコードしない
const internalDomains = ['gmail.com', 'company.com']; // ❌ 悪い例
```

### 3. エラーハンドリング

```javascript
try {
  // API呼び出し
  const result = await apiCall();
} catch (error) {
  // エラーログ（シークレット情報を含めない）
  console.error('API call failed:', error.message);
  // 適切なフォールバック処理
  return { status: 'error', retry: true };
}
```

### 4. ログ出力

**❌ 悪い例**:
```javascript
console.log('API Key:', process.env.API_KEY); // シークレット漏洩
console.log('User data:', userData); // 個人情報漏洩
```

**✅ 良い例**:
```javascript
console.log('API call initiated'); // 安全
console.log('User ID:', userData.id); // 最小限の情報のみ
```

---

## 📋 セキュリティチェックリスト

ワークフローをデプロイする前に以下を確認:

- [ ] APIキー・トークンがハードコードされていない
- [ ] すべての認証情報がN8Nクレデンシャルで管理されている
- [ ] 環境変数が適切に設定されている
- [ ] エラーハンドリングが実装されている
- [ ] ログにシークレット情報が含まれていない
- [ ] アクセス権限が最小限に制限されている
- [ ] HTTPSを使用している（HTTPは使用しない）
- [ ] タイムアウト設定がされている

---

## 🚨 緊急時の対応

### トークンが漏洩した場合

1. **即座にトークンを無効化**
   - Google: https://myaccount.google.com/permissions
   - Supabase: Dashboard → Settings → API → Reset Key

2. **新しいトークンを生成**
3. **N8Nクレデンシャルを更新**
4. **影響範囲を調査**
   - アクセスログの確認
   - 不正アクセスの有無

5. **セキュリティレポートを作成**

---

## 📚 参考資料

### N8N公式ドキュメント
- [Credentials](https://docs.n8n.io/credentials/)
- [Security Best Practices](https://docs.n8n.io/hosting/security/)

### API認証ガイド
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## 🔄 ワークフローの比較

### 元のワークフロー vs セキュアなワークフロー

| 項目 | 元のワークフロー | セキュアなワークフロー |
|------|------------------|----------------------|
| Google認証 | ❌ ハードコードされたトークン | ✅ OAuth2クレデンシャル |
| Supabase認証 | ❌ ハードコードされたAPIキー | ✅ Supabaseクレデンシャル |
| HTTPリクエスト | ❌ 手動でヘッダー設定 | ✅ 標準ノードを使用 |
| エラーハンドリング | ❌ なし | ✅ try-catchで実装 |
| ログ出力 | ❌ シークレット含む可能性 | ✅ 安全な情報のみ |
| 条件分岐 | ❌ 複雑なJavaScript | ✅ IFノードで明確 |

---

## 🎯 まとめ

### 元のワークフローを使用しないでください

元のワークフローには**重大なセキュリティリスク**があります。以下のファイルを使用してください：

✅ **使用すべきファイル**: `secured-calendar-sync-workflow.json`

このファイルは：
- すべてのクレデンシャルを安全に管理
- N8Nのベストプラクティスに準拠
- エラーハンドリングを実装
- 保守性が高い構造

---

**最終更新**: 2025-10-18
**作成者**: Claude Code
**バージョン**: 2.0 (Secured)
