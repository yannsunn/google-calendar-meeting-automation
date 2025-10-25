# Google Apps Script デプロイ手順

## 1. Google Apps Scriptプロジェクトの作成

1. https://script.google.com/ にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「DX Proposal Slide Generator」に変更

## 2. コードのコピー

1. 左側の「コード.gs」をクリック
2. `gas-slide-generator/Code.gs` の内容を全てコピー
3. エディタに貼り付け
4. 「💾 保存」ボタンをクリック

## 3. Webアプリとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」をクリック
2. 「種類の選択」で「⚙️ ウェブアプリ」を選択
3. 以下の設定を行う：
   - **説明**: DX Proposal Slide Generator v1.0
   - **次のユーザーとして実行**: 自分（あなたのGoogleアカウント）
   - **アクセスできるユーザー**: 全員
4. 「デプロイ」をクリック
5. 権限の承認を求められたら「アクセスを承認」をクリック
6. **Webアプリの URL** が表示されるので、これをコピーして保存

例: `https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxx/exec`

## 4. 動作確認

ブラウザで WebアプリのURL にアクセスして、以下のJSONが返ってくることを確認：

```json
{
  "status": "active",
  "message": "DX Proposal Slide Generator API is running",
  "version": "1.0.0"
}
```

## 5. N8Nで使用するために

コピーした **WebアプリのURL** を以下のファイルに記録してください：

`gas-webhook-url.txt`

---

## トラブルシューティング

### エラー: "承認が必要です"

1. Google Apps Scriptエディタで「実行」→「doGet」を選択
2. 権限の確認画面で「権限を確認」をクリック
3. あなたのGoogleアカウントを選択
4. 「詳細」→「DX Proposal Slide Generator (安全ではないページ) に移動」をクリック
5. 「許可」をクリック

### エラー: "このアプリは確認されていません"

これは正常です。自分で作成したスクリプトなので、「詳細」→「移動」で続行してください。

---

## 次のステップ

デプロイが完了したら、WebアプリのURLを使ってN8Nワークフローを更新します。
