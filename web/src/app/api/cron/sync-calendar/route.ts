import { NextRequest, NextResponse } from 'next/server'
import { syncCalendarEvents } from '../../calendar/auto-sync/route'

// Vercel Cron Job用のエンドポイント
// vercel.jsonで設定: 1時間ごとに実行
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（Vercel Cronからのリクエストか確認）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Cron: カレンダー同期開始', new Date().toISOString())

    // カレンダー同期を実行
    const result = await syncCalendarEvents()

    console.log('✅ Cron: 同期完了', result)

    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      ...result
    })
  } catch (error: any) {
    console.error('❌ Cron: 同期エラー', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}