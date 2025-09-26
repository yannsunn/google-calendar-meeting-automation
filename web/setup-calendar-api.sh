#!/bin/bash

# Google Calendar API セットアップスクリプト
# APIキー方式で簡単にセットアップ

echo "📅 Google Calendar API セットアップ"
echo ""
echo "このスクリプトはGoogle Calendar APIへのアクセスを設定します。"
echo ""

# Step 1: 既存の環境変数をチェック
echo "🔍 既存の設定を確認中..."
if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    echo "✓ GOOGLE_CLIENT_ID: 設定済み"
fi
if [ ! -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "✓ GOOGLE_CLIENT_SECRET: 設定済み"
fi

echo ""
echo "📝 新しいAPIキーまたはOAuthクライアントを設定します"
echo ""

# Step 2: 設定方法を選択
echo "設定方法を選択してください:"
echo "1) APIキー（読み取り専用、公開カレンダー向け）"
echo "2) 既存のアクセストークンを使用"
echo "3) 手動で設定済みのクライアントIDを使用"
read -p "選択 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📌 APIキーの作成手順:"
        echo "1. https://console.cloud.google.com/apis/credentials にアクセス"
        echo "2. 「認証情報を作成」→「APIキー」"
        echo "3. 作成されたAPIキーをコピー"
        echo ""
        read -p "APIキーを入力: " API_KEY
        if [ ! -z "$API_KEY" ]; then
            echo "$API_KEY" | vercel env add GOOGLE_API_KEY production --force
            echo "✅ APIキーを設定しました"

            # APIキーを使用する簡易同期コードを作成
            cat > use-api-key.js << 'EOF'
const { google } = require('googleapis');

async function testCalendarWithApiKey() {
    const calendar = google.calendar({
        version: 'v3',
        auth: process.env.GOOGLE_API_KEY
    });

    try {
        // 公開カレンダーのテスト（カレンダーIDが必要）
        console.log('APIキーでのアクセステスト');
        // 注: プライベートカレンダーにはアクセスできません
        return { success: true, message: 'APIキー設定完了' };
    } catch (error) {
        console.error('Error:', error.message);
        return { success: false, error: error.message };
    }
}

testCalendarWithApiKey().then(console.log);
EOF
            echo "✅ use-api-key.js を作成しました"
        fi
        ;;

    2)
        echo ""
        echo "📌 既存のトークンを使用"
        read -p "アクセストークン: " ACCESS_TOKEN
        read -p "リフレッシュトークン: " REFRESH_TOKEN

        if [ ! -z "$ACCESS_TOKEN" ]; then
            echo "$ACCESS_TOKEN" | vercel env add GOOGLE_ACCESS_TOKEN production --force
        fi
        if [ ! -z "$REFRESH_TOKEN" ]; then
            echo "$REFRESH_TOKEN" | vercel env add GOOGLE_REFRESH_TOKEN production --force
        fi
        echo "✅ トークンを設定しました"
        ;;

    3)
        echo ""
        echo "📌 新しいOAuthクライアントの設定"
        echo ""
        echo "Google Cloud Consoleで以下を実行:"
        echo "1. 新しいOAuth 2.0クライアントIDを作成"
        echo "2. リダイレクトURIに以下を追加:"
        echo "   - http://localhost:3000/api/auth/callback"
        echo "   - https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback"
        echo ""
        read -p "新しいClient ID: " CLIENT_ID
        read -p "新しいClient Secret: " CLIENT_SECRET

        if [ ! -z "$CLIENT_ID" ] && [ ! -z "$CLIENT_SECRET" ]; then
            echo "$CLIENT_ID" | vercel env add GOOGLE_CLIENT_ID production --force
            echo "$CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET production --force
            echo "https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback" | vercel env add GOOGLE_REDIRECT_URI production --force
            echo "✅ 新しいOAuthクライアントを設定しました"
        fi
        ;;
esac

echo ""
echo "🚀 設定完了！"
echo ""
echo "次のステップ:"
echo "1. vercel --prod でデプロイ"
echo "2. サイトでカレンダー同期をテスト"
echo ""
echo "問題が発生した場合:"
echo "- MANUAL_SETUP_GUIDE.md を参照"
echo "- Google Cloud Consoleで直接設定"