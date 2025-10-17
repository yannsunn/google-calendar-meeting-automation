/**
 * シンプルなインメモリレート制限
 *
 * 注意: この実装は単一インスタンスでのみ機能します。
 * 本番環境でスケーリングする場合は、Redisなどの外部ストアを使用してください。
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private records = new Map<string, RateLimitRecord>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // 5分ごとに期限切れレコードをクリーンアップ
    if (typeof window === 'undefined') {
      // サーバーサイドでのみ実行
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000)
    }
  }

  /**
   * レート制限をチェック
   *
   * @param key ユニークな識別子（IPアドレスやユーザーIDなど）
   * @param limit 時間枠内の最大リクエスト数
   * @param window 時間枠（ミリ秒）
   * @returns 許可される場合はtrue、制限を超える場合はfalse
   */
  check(key: string, limit: number = 100, window: number = 60000): boolean {
    const now = Date.now()
    const record = this.records.get(key)

    // レコードが存在しないか、期限切れの場合
    if (!record || now > record.resetTime) {
      this.records.set(key, {
        count: 1,
        resetTime: now + window,
      })
      return true
    }

    // 制限を超えている場合
    if (record.count >= limit) {
      return false
    }

    // カウントを増やす
    record.count++
    return true
  }

  /**
   * 特定のキーの制限をリセット
   */
  reset(key: string): void {
    this.records.delete(key)
  }

  /**
   * すべての制限をクリア
   */
  clearAll(): void {
    this.records.clear()
  }

  /**
   * 期限切れレコードをクリーンアップ
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.records.forEach((record, key) => {
      if (now > record.resetTime) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.records.delete(key)
    })
  }

  /**
   * クリーンアップ間隔を停止
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// シングルトンインスタンス
export const rateLimiter = new RateLimiter()

/**
 * APIルートでのレート制限ヘルパー
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const limited = await checkRateLimit(request, { limit: 10, window: 60000 })
 *   if (limited) {
 *     return limited // 429エラーレスポンスを返す
 *   }
 *   // 正常な処理を続行
 * }
 * ```
 */
export async function checkRateLimit(
  request: Request,
  options: { limit?: number; window?: number } = {}
): Promise<Response | null> {
  const { limit = 100, window = 60000 } = options

  // IPアドレスを取得
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  // レート制限をチェック
  const allowed = rateLimiter.check(ip, limit, window)

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(window / 1000)),
        },
      }
    )
  }

  return null
}
