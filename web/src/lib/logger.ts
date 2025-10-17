type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  userId?: string
  requestId?: string
  apiEndpoint?: string
  duration?: number
  [key: string]: any
}

interface LoggerOptions {
  context?: string
  data?: Record<string, unknown>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, options?: LoggerOptions): string {
    const timestamp = new Date().toISOString()
    const context = options?.context ? `[${options.context}]` : ''
    return `[${timestamp}] ${level.toUpperCase()} ${context} ${message}`
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()

    // 本番環境では構造化JSONログ
    if (this.isProduction) {
      const logEntry = {
        timestamp,
        level,
        message,
        ...context,
      }
      console.log(JSON.stringify(logEntry))
    } else {
      // 開発環境では読みやすい形式
      const contextStr = context ? JSON.stringify(context, null, 2) : ''
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, contextStr)
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    this.log('error', message, errorContext)
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  /**
   * HTTP リクエストのロギング
   */
  httpRequest(options: {
    method: string
    url: string
    statusCode: number
    duration: number
    userId?: string
  }): void {
    this.info('HTTP Request', {
      method: options.method,
      url: options.url,
      statusCode: options.statusCode,
      duration: options.duration,
      userId: options.userId,
    })
  }

  /**
   * APIエラーのロギング
   */
  apiError(options: {
    endpoint: string
    method: string
    error: Error | unknown
    userId?: string
    requestId?: string
  }): void {
    this.error(`API Error: ${options.endpoint}`, options.error, {
      endpoint: options.endpoint,
      method: options.method,
      userId: options.userId,
      requestId: options.requestId,
    })
  }
}

export const logger = new Logger()
