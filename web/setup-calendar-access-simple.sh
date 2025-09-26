#!/bin/bash

# シンプルなカレンダーアクセス権限設定スクリプト
# curlコマンドを使用してGoogle Calendar APIを直接呼び出します

echo "🔧 Google Calendar アクセス権限設定（簡易版）"
echo "============================================"
echo ""
echo "このスクリプトは、サービスアカウントにカレンダーへのアクセス権限を付与します。"
echo ""

# サービスアカウントのメールアドレス
SERVICE_ACCOUNT_EMAIL="calendar-sync-service@amazon-457206.iam.gserviceaccount.com"

echo "📧 サービスアカウント: $SERVICE_ACCOUNT_EMAIL"
echo ""

# ステップ1: アクセストークンの取得方法を説明
echo "📝 ステップ1: Google アクセストークンを取得"
echo "---------------------------------------"
echo ""
echo "以下のいずれかの方法でアクセストークンを取得してください："
echo ""
echo "方法A: OAuth Playground を使用（推奨）"
echo "  1. https://developers.google.com/oauthplayground/ を開く"
echo "  2. 左側のAPIリストから 'Google Calendar API v3' を選択"
echo "  3. 'https://www.googleapis.com/auth/calendar.acls' にチェック"
echo "  4. 'Authorize APIs' をクリックしてGoogleアカウントでログイン"
echo "  5. 'Exchange authorization code for tokens' をクリック"
echo "  6. 表示される 'Access token' をコピー"
echo ""
echo "方法B: gcloud CLI を使用"
echo "  gcloud auth login"
echo "  gcloud auth print-access-token"
echo ""

# アクセストークンの入力
echo "取得したアクセストークンを入力してください:"
read ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ アクセストークンが入力されていません"
    exit 1
fi

# カレンダーIDの入力
echo ""
echo "カレンダーIDを入力してください (空の場合は 'primary' を使用):"
read CALENDAR_ID
CALENDAR_ID=${CALENDAR_ID:-primary}

# ステップ2: APIリクエストの送信
echo ""
echo "📝 ステップ2: カレンダーへのアクセス権限を設定中..."
echo "---------------------------------------"

# curlでAPIリクエストを送信
RESPONSE=$(curl -s -X POST \
  "https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/acl" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "reader",
    "scope": {
      "type": "user",
      "value": "'${SERVICE_ACCOUNT_EMAIL}'"
    }
  }')

# レスポンスの確認
if echo "$RESPONSE" | grep -q '"id"'; then
    echo ""
    echo "✅ アクセス権限を正常に設定しました！"
    echo ""
    echo "設定内容:"
    echo "  カレンダーID: $CALENDAR_ID"
    echo "  サービスアカウント: $SERVICE_ACCOUNT_EMAIL"
    echo "  権限: 読み取り専用"
    echo ""
    echo "🎉 設定完了！カレンダー同期が正常に動作するはずです。"
elif echo "$RESPONSE" | grep -q "already exists"; then
    echo ""
    echo "⚠️  このサービスアカウントには既にアクセス権限が設定されています。"
    echo "  カレンダー同期は正常に動作するはずです。"
else
    echo ""
    echo "❌ エラーが発生しました:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "📋 手動で設定する場合の手順:"
    echo "1. Google Calendar (https://calendar.google.com) を開く"
    echo "2. 設定（歯車アイコン）→ 設定"
    echo "3. 左メニューから共有したいカレンダーを選択"
    echo "4. 「特定のユーザーまたはグループと共有」セクション"
    echo "5. 「ユーザーやグループを追加」をクリック"
    echo "6. 以下のメールアドレスを入力:"
    echo "   $SERVICE_ACCOUNT_EMAIL"
    echo "7. 権限を「閲覧権限（すべての予定の詳細）」に設定"
    echo "8. 「送信」をクリック"
fi