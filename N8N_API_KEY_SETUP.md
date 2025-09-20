# N8N APIキー設定ガイド

## N8N APIキーを使用する理由

N8N APIキーを使用することで、以下の高度な機能が利用可能になります：

1. **ワークフロー管理**: Web UIから直接N8Nワークフローを管理
2. **実行状態監視**: ワークフローの実行状態をリアルタイムで確認
3. **自動実行**: プログラムから任意のワークフローを実行
4. **履歴管理**: 過去の実行履歴を確認・分析

## N8N APIキーの取得手順

### ステップ1: N8N管理画面にアクセス

1. ブラウザで以下のURLにアクセス：
   ```
   https://n8n.srv946785.hstgr.cloud
   ```

2. 管理者アカウントでログイン

### ステップ2: APIキーの生成

1. 左側のメニューから **Settings** をクリック
2. **API** タブを選択
3. **API Enabled** をONに設定
4. **Generate API Key** ボタンをクリック
5. 生成されたAPIキーをコピー（このキーは一度しか表示されません）

### ステップ3: 環境変数に設定

#### Vercel Dashboard での設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト `web` を選択
3. **Settings** → **Environment Variables** に移動
4. 以下を追加：
   ```
   N8N_API_KEY = [コピーしたAPIキー]
   ```
5. **Save** をクリック

#### ローカル開発環境での設定

`.env.local` ファイルに追加：
```bash
N8N_API_KEY=your_n8n_api_key_here
```

## APIキー使用時の機能

### 1. ワークフロー一覧表示
- すべてのワークフローとその状態を確認
- アクティブ/非アクティブの状態表示

### 2. ワークフロー実行
- Web UIから直接ワークフローを実行
- パラメータを指定して実行

### 3. 実行履歴
- 過去の実行結果を確認
- 成功/失敗の状態を監視
- 実行時間の分析

### 4. リアルタイム更新
- 10秒ごとに自動的に状態を更新
- 実行中のワークフローをリアルタイム監視

## セキュリティ上の注意

1. **APIキーは機密情報です**
   - Gitにコミットしない
   - 公開リポジトリに含めない
   - 環境変数として管理

2. **アクセス制限**
   - 必要最小限の権限のみ付与
   - 定期的にキーを更新

3. **監査ログ**
   - API経由のすべての操作はログに記録される
   - 不審なアクセスを定期的に確認

## トラブルシューティング

### APIキーが機能しない場合

1. **N8N側の設定確認**
   - API機能が有効になっているか確認
   - キーが正しくコピーされているか確認

2. **環境変数の確認**
   ```bash
   # Vercelで環境変数が設定されているか確認
   vercel env ls
   ```

3. **再デプロイ**
   - 環境変数を追加後は必ず再デプロイが必要
   ```bash
   vercel --prod
   ```

### エラーメッセージ別対処法

- **"N8N_API_KEY is not configured"**
  → 環境変数が設定されていません。上記手順で設定してください。

- **"Failed to fetch workflows"**
  → APIキーが無効か、N8Nサーバーに接続できません。

- **"Unauthorized"**
  → APIキーが間違っているか、期限切れです。

## 高度な使い方

### プログラムからの直接呼び出し

```typescript
// N8N APIを直接呼び出す例
import { executeWorkflow } from '@/lib/n8n-api';

// ワークフローを実行
const result = await executeWorkflow('workflow-id', {
  param1: 'value1',
  param2: 'value2'
});
```

### カスタムトリガーの作成

```typescript
// 特定の条件でワークフローを自動実行
if (meetingCount > 5) {
  await triggerWebhook('daily-summary', {
    date: new Date().toISOString(),
    count: meetingCount
  });
}
```

## サポート

問題が発生した場合は、以下をご確認ください：

1. N8N Documentation: https://docs.n8n.io/api/
2. GitHub Issues: https://github.com/yannsunn/google-calendar-meeting-automation/issues
3. N8N Community: https://community.n8n.io/