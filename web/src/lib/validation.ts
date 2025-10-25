import { z } from 'zod'

// URLのバリデーション
const urlSchema = z.string().url().max(2000)

// 提案生成リクエストのバリデーションスキーマ
export const proposalRequestSchema = z.object({
  event_id: z.string().min(1).max(100),
  company_name: z.string().min(1).max(200).regex(/^[^<>'"]*$/, 'Invalid characters in company name'),
  company_urls: z.array(urlSchema).max(10).optional(),
  summary: z.string().min(1).max(500).optional(),
  start_time: z.string().datetime().optional(),
  user_email: z.string().email().optional(),
  preview_mode: z.boolean().optional(),
  generate_slides: z.boolean().optional(),
})

// 会議データのバリデーションスキーマ
export const meetingSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().max(500).optional(),
  meeting_url: z.string().url().max(2000).optional(),
  company_name: z.string().max(200).optional(),
})

// サニタイズ関数
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTMLタグを除去
    .replace(/javascript:/gi, '') // JavaScriptプロトコルを除去
    .replace(/on\w+\s*=/gi, '') // イベントハンドラを除去
    .trim()
}

// SQLインジェクション対策
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''")
}

// XSS対策
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// レート制限用のトークンバケット
class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.tokens.get(identifier)

    if (!record || now > record.resetTime) {
      this.tokens.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (record.count >= this.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  reset(identifier: string): void {
    this.tokens.delete(identifier)
  }
}

// グローバルレート制限インスタンス
export const rateLimiter = new RateLimiter(10, 60000) // 1分間に10リクエストまで