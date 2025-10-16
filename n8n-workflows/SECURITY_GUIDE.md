# 🔐 N8Nワークフロー セキュリティ設定ガイド

## ⚠️ 重要: APIキーのハードコード問題

現在、`final-ai-agent-workflow.json`および他のワークフローファイルには、以下のAPIキーがハードコードされています：

1. **Google Calendar Access Token** (Line 58)
2. **Supabase API Key** (Line 96, 100, 232, 236)
3. **OpenAI API Key** (Credentials経由だが確認必要)

これらは**セキュリティリスク**となるため、N8N Credentials機能を使用して管理する必要があります。

---

## ✅ 推奨される対応方法

### 1. N8N Credentialsの設定

#### ステップ1: N8N管理画面にアクセス
```
https://n8n.srv946785.hstgr.cloud
```

#### ステップ2: Credentials画面を開く
1. 左サイドバーの「Credentials」をクリック
2. 「Add Credential」をクリック

#### ステップ3: Google Calendar用Credentialを作成

**Credential Type**: Google OAuth2 API

**設定項目**:
- Client ID: `863342165958-injqmkknst50s15bma0rp04hlhla1lm7.apps.googleusercontent.com`
- Client Secret: （Google Cloud Consoleから取得）
- Scope: `https://www.googleapis.com/auth/calendar.readonly`
- Auth URI: `https://accounts.google.com/o/oauth2/auth`
- Token URI: `https://oauth2.googleapis.com/token`

**保存後**: OAuth認証フローを完了

#### ステップ4: Supabase用Credentialを作成

**Credential Type**: HTTP Header Auth

**設定項目**:
- Name: `apikey`
- Value: `{{ $env.SUPABASE_ANON_KEY }}` （環境変数を使用）

**別のCredential**: Authorization Header
- Name: `Authorization`
- Value: `Bearer {{ $env.SUPABASE_ANON_KEY }}`

#### ステップ5: OpenAI用Credentialを確認

既に作成されているCredential (`eHxVOhErZCHagO3j`) を確認：
- Credential Type: OpenAI API
- API Key: 環境変数 `{{ $env.OPENAI_API_KEY }}` を使用

---

### 2. ワークフローの修正

#### 修正箇所1: Google Calendar API ノード

**現在**:
```json
"headerParameters": {
  "parameters": [
    {
      "name": "Authorization",
      "value": "Bearer ya29.a0AQQ_BDT-rHVy8h6vbiTB8Rir1n2Dt5oZhejJaiv..."
    }
  ]
}
```

**修正後**:
```json
"authentication": "predefinedCredentialType",
"nodeCredentialType": "googleOAuth2Api",
"sendHeaders": false
```

#### 修正箇所2: Supabase保存ノード

**現在**:
```json
"headerParameters": {
  "parameters": [
    {
      "name": "apikey",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ]
}
```

**修正後**:
```json
"authentication": "genericCredentialType",
"genericAuthType": "httpHeaderAuth",
"headerParameters": {
  "parameters": [
    {
      "name": "apikey",
      "value": "={{$credentials.supabaseApiKey}}"
    }
  ]
}
```

または、N8N環境変数を使用:
```json
"value": "={{$env.SUPABASE_ANON_KEY}}"
```

---

### 3. N8N環境変数の設定

N8N管理画面で環境変数を設定:

```bash
# Settings > Environment Variables

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://dpqsipbppdemgfwuihjr.supabase.co
GOOGLE_CALENDAR_API_KEY=（不要 - OAuth使用）
OPENAI_API_KEY=sk-...
SERPER_API_KEY=...（Web検索用）
```

---

## 🔄 移行手順

### Phase 1: Credentialsの作成（今すぐ実施）

1. N8N管理画面にログイン
2. 上記の手順に従ってCredentialsを作成
3. 認証フローを完了

### Phase 2: ワークフローの更新（Credentiaも作成後）

1. N8Nエディタで `final-ai-agent-workflow` を開く
2. 各ノードを編集:
   - **Google Calendar API ノード**: Credentialを選択
   - **Supabase保存ノード**: Credentialまたは環境変数を使用
   - **提案保存ノード**: Credentialまたは環境変数を使用
3. ワークフローを保存
4. テスト実行

### Phase 3: ハードコードされたキーの削除

1. ワークフローをエクスポート
2. JSONファイルから以下を削除:
   - Google Access Token
   - Supabase API Key
3. プレースホルダーに置き換え
4. Git履歴からも削除（必要に応じて）

---

## 📊 セキュリティチェックリスト

- [ ] Google OAuth2 Credentialを作成
- [ ] Supabase API Key Credentialを作成
- [ ] OpenAI Credentialを確認
- [ ] ワークフロー内のハードコードされたキーを削除
- [ ] N8N環境変数を設定
- [ ] ワークフローをテスト実行
- [ ] エクスポートしたJSONファイルにキーが含まれていないことを確認

---

## 🚨 緊急対応

もし、このファイルが公開リポジトリにコミットされている場合:

1. **即座に無効化**:
   - Google Cloud Console: OAuth Clientを無効化/再生成
   - Supabase: API Keyを再生成（Project Settings > API）
   - OpenAI: API Keyを無効化/再生成

2. **Git履歴から削除**:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch n8n-workflows/*.json" \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **新しいCredentialsで再設定**

---

## 📚 参考リンク

- [N8N Credentials Documentation](https://docs.n8n.io/credentials/)
- [N8N Environment Variables](https://docs.n8n.io/hosting/environment-variables/)
- [Google OAuth2 Setup](https://console.cloud.google.com/apis/credentials)
- [Supabase API Keys](https://supabase.com/dashboard/project/dpqsipbppdemgfwuihjr/settings/api)

---

## 💡 ベストプラクティス

1. **絶対にハードコードしない**: APIキー、トークン、パスワード
2. **Credentialsを使用**: N8Nの組み込み機能を活用
3. **環境変数を活用**: 環境ごとに異なる値を管理
4. **定期的にローテーション**: APIキーを定期的に更新
5. **最小権限の原則**: 必要最小限の権限のみを付与
6. **監視とロギング**: API使用状況を監視
7. **バックアップ**: Credentialsをセキュアに保管

---

最終更新: 2025年10月16日
