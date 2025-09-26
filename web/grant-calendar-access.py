#!/usr/bin/env python3

"""
Google Calendar アクセス権限付与スクリプト
サービスアカウントにカレンダーへのアクセス権限を自動的に付与します
"""

import os
import json
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# サービスアカウントのメールアドレス
SERVICE_ACCOUNT_EMAIL = "calendar-sync-service@amazon-457206.iam.gserviceaccount.com"

def grant_calendar_access_with_oauth():
    """OAuth認証を使用してカレンダーアクセス権限を付与"""

    print("🔧 Google Calendar アクセス権限設定ツール")
    print("=" * 40)
    print()
    print(f"📧 サービスアカウント: {SERVICE_ACCOUNT_EMAIL}")
    print()

    # OAuth認証設定
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.acls'
    ]

    creds = None

    # token.jsonファイルがあれば読み込み
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # 認証が必要な場合
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # credentials.jsonファイルが必要
            if not os.path.exists('credentials.json'):
                print("❌ credentials.json ファイルが見つかりません")
                print("   Google Cloud Console から OAuth2 クライアント認証情報をダウンロードしてください")
                return False

            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # トークンを保存
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    # Calendar APIサービスを構築
    service = build('calendar', 'v3', credentials=creds)

    # カレンダーIDを取得
    calendar_id = input("カレンダーIDを入力してください (空の場合は 'primary'): ").strip() or 'primary'

    # ACLルールを作成
    acl_rule = {
        'role': 'reader',
        'scope': {
            'type': 'user',
            'value': SERVICE_ACCOUNT_EMAIL
        }
    }

    try:
        # ACLにサービスアカウントを追加
        result = service.acl().insert(
            calendarId=calendar_id,
            body=acl_rule
        ).execute()

        print()
        print("✅ アクセス権限を正常に設定しました！")
        print(f"   カレンダーID: {calendar_id}")
        print(f"   サービスアカウント: {SERVICE_ACCOUNT_EMAIL}")
        print(f"   権限: 読み取り専用")
        print()
        print("🎉 設定完了！カレンダー同期が正常に動作するはずです。")
        return True

    except Exception as e:
        if 'already exists' in str(e):
            print("⚠️  このサービスアカウントには既にアクセス権限が設定されています。")
            return True
        else:
            print(f"❌ エラーが発生しました: {e}")
            return False

def grant_calendar_access_programmatically():
    """
    プログラム的にカレンダーアクセス権限を付与する別の方法
    既存の認証済みユーザーのトークンを使用
    """

    print("\n別の方法: 既存のアクセストークンを使用")
    print("-" * 40)

    access_token = input("Google アクセストークンを入力してください: ").strip()

    if not access_token:
        print("❌ アクセストークンが入力されていません")
        return False

    calendar_id = input("カレンダーIDを入力してください (空の場合は 'primary'): ").strip() or 'primary'

    import requests

    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/acl"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    data = {
        "role": "reader",
        "scope": {
            "type": "user",
            "value": SERVICE_ACCOUNT_EMAIL
        }
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        print("✅ アクセス権限を正常に設定しました！")
        return True
    else:
        print(f"❌ エラーが発生しました: {response.text}")
        return False

def main():
    """メイン関数"""

    print("\nどの方法を使用しますか？")
    print("1. OAuth認証を使用（推奨）")
    print("2. アクセストークンを直接入力")
    print("3. 手動設定の手順を表示")

    choice = input("\n選択してください (1-3): ").strip()

    if choice == "1":
        success = grant_calendar_access_with_oauth()
    elif choice == "2":
        success = grant_calendar_access_programmatically()
    else:
        print("\n📋 手動で設定する場合の手順:")
        print("1. Google Calendar (https://calendar.google.com) を開く")
        print("2. 設定（歯車アイコン）→ 設定")
        print("3. 左メニューから共有したいカレンダーを選択")
        print("4. 「特定のユーザーまたはグループと共有」セクション")
        print("5. 「ユーザーやグループを追加」をクリック")
        print(f"6. 以下のメールアドレスを入力: {SERVICE_ACCOUNT_EMAIL}")
        print("7. 権限を「閲覧権限（すべての予定の詳細）」に設定")
        print("8. 「送信」をクリック")
        success = True

    if not success:
        print("\n自動設定に失敗しました。手動設定の手順を参照してください。")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n操作がキャンセルされました。")
    except Exception as e:
        print(f"\n❌ 予期しないエラーが発生しました: {e}")