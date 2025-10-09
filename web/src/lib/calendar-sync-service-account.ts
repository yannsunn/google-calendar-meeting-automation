import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { DatabaseMeeting, SyncResult } from '@/types/database'

// Supabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// サービスアカウント認証
async function getServiceAccountAuth() {
  try {
    // 環境変数からサービスアカウントキーを取得
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set')
    }

    // JSONをパース
    const key = typeof serviceAccountKey === 'string'
      ? JSON.parse(serviceAccountKey)
      : serviceAccountKey

    // JWT認証クライアントを作成
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
      ]
    })

    return auth
  } catch (error) {
    console.error('Service account authentication failed:', error)
    throw error
  }
}

// カレンダーイベントを取得して保存（サービスアカウント版）
export async function syncCalendarEventsWithServiceAccount(): Promise<SyncResult> {
  try {
    // サービスアカウント認証
    const auth = await getServiceAccountAuth()

    const calendar = google.calendar({ version: 'v3', auth })

    // カレンダーIDを取得（primaryまたは特定のカレンダーID）
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

    // 今後7日間のイベントを取得
    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: now.toISOString(),
      timeMax: weekLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    })

    const events = response.data.items || []

    // Supabaseに保存
    const savedEvents = []
    for (const event of events) {
      const meetingData: DatabaseMeeting = {
        google_event_id: event.id!,
        title: event.summary || 'タイトルなし',
        description: event.description || '',
        start_time: event.start?.dateTime || event.start?.date,
        end_time: event.end?.dateTime || event.end?.date,
        location: event.location || '',
        meeting_url: event.hangoutLink || '',
        organizer_email: event.organizer?.email || '',
        is_enabled: true,
        status: 'scheduled' as const,
        attendees: event.attendees || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('meetings')
        .upsert(meetingData, { onConflict: 'google_event_id' })
        .select()

      if (!error && data) {
        savedEvents.push(data[0])
      }
    }

    return {
      success: true,
      eventsCount: events.length,
      savedCount: savedEvents.length,
      lastSync: new Date().toISOString()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Service account sync failed:', error)
    return {
      success: false,
      error: errorMessage,
      lastSync: new Date().toISOString()
    }
  }
}

// 既存の関数との互換性のため、エクスポート名を統一
export async function syncCalendarEvents(): Promise<SyncResult> {
  // まずサービスアカウントを試す
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    console.log('Using service account authentication')
    return syncCalendarEventsWithServiceAccount()
  }

  // サービスアカウントがない場合は、OAuth認証を試す（既存のコード）
  console.log('Service account not configured, falling back to OAuth')

  // ここに既存のOAuth認証コードを配置することも可能
  return {
    success: false,
    error: 'No authentication method configured. Please set up service account or OAuth.',
    lastSync: new Date().toISOString()
  }
}