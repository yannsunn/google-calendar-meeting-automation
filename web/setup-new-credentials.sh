#!/bin/bash
# 新しいGoogle認証情報セットアップスクリプト

echo "🔧 Google Calendar API 認証情報セットアップ"
echo ""

# APIキー設定
echo "1. APIキーを入力してください:"
read -p "API Key: " GOOGLE_API_KEY

if [ ! -z "$GOOGLE_API_KEY" ]; then
  echo "$GOOGLE_API_KEY" | vercel env add GOOGLE_API_KEY production --force
  echo "✅ APIキーを設定しました"
fi

# 新しいOAuthクライアントID設定
echo ""
echo "2. 新しいOAuth 2.0クライアントIDを作成した場合:"
read -p "Client ID (省略可): " NEW_CLIENT_ID
read -p "Client Secret (省略可): " NEW_CLIENT_SECRET

if [ ! -z "$NEW_CLIENT_ID" ] && [ ! -z "$NEW_CLIENT_SECRET" ]; then
  echo "$NEW_CLIENT_ID" | vercel env add GOOGLE_CLIENT_ID production --force
  echo "$NEW_CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET production --force
  echo "✅ OAuthクライアントを更新しました"
fi

# リダイレクトURIを更新
echo "https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback/google" | vercel env add GOOGLE_REDIRECT_URI production --force

echo ""
echo "✅ 環境変数の設定が完了しました"
echo ""
echo "次のステップ:"
echo "1. vercel --prod でデプロイ"
echo "2. https://calendar-bgsbsbnp0-yasuus-projects.vercel.app でテスト"
