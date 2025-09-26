import { NextRequest, NextResponse } from 'next/server'
import { syncCalendarEvents } from '@/lib/calendar-sync-service-account'

// APIエンドポイント
export async function POST(request: NextRequest) {
  try {
    const result = await syncCalendarEvents()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET エンドポイント（手動実行用）
export async function GET(request: NextRequest) {
  return POST(request)
}