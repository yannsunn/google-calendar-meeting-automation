#!/bin/bash
# Vercel環境変数設定スクリプト

echo "🔧 Vercel環境変数を設定します..."

# APIキー方式（公開カレンダー用）
echo "APIキーを入力（省略可）:"
read GOOGLE_API_KEY
if [ ! -z "$GOOGLE_API_KEY" ]; then
  echo "$GOOGLE_API_KEY" | vercel env add GOOGLE_API_KEY production --force
fi

# 既存のトークンを使用する場合
echo "アクセストークンを入力（省略可）:"
read GOOGLE_ACCESS_TOKEN
if [ ! -z "$GOOGLE_ACCESS_TOKEN" ]; then
  echo "$GOOGLE_ACCESS_TOKEN" | vercel env add GOOGLE_ACCESS_TOKEN production --force
fi

echo "リフレッシュトークンを入力（省略可）:"
read GOOGLE_REFRESH_TOKEN
if [ ! -z "$GOOGLE_REFRESH_TOKEN" ]; then
  echo "$GOOGLE_REFRESH_TOKEN" | vercel env add GOOGLE_REFRESH_TOKEN production --force
fi

echo "✅ 設定完了"
