import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// シンプルなインメモリレート制限
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 静的ファイルとNext.js内部リソースはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // IPアドレスを取得
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  // API エンドポイントのレート制限
  if (pathname.startsWith('/api/')) {
    // API用のレート制限: 100リクエスト/分
    if (!checkRateLimit(ip, 100, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Please try again later' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    // APIエンドポイントは認証不要（認証が必要な場合はエンドポイント内で確認）
    return NextResponse.next()
  }

  // 認証ページはスキップ
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // 認証チェック
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // トークンエラーがある場合は再ログインを促す
  if (token.error === 'RefreshAccessTokenError') {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('error', 'TokenRefreshError')
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 以下のパス以外はすべてミドルウェアを通過
     * - /api/auth/... (NextAuth)
     * - /_next/... (Next.js internal)
     * - /favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
