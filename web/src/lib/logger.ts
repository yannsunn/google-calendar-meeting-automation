type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LoggerOptions {
  context?: string
  data?: Record<string, unknown>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, options?: LoggerOptions): string {
    const timestamp = new Date().toISOString()
    const context = options?.context ? `[${options.context}]` : ''
    return `[${timestamp}] ${level.toUpperCase()} ${context} ${message}`
  }

  info(message: string, options?: LoggerOptions): void {
    const formatted = this.formatMessage('info', message, options)
    console.log(formatted, options?.data || '')
  }

  warn(message: string, options?: LoggerOptions): void {
    const formatted = this.formatMessage('warn', message, options)
    console.warn(formatted, options?.data || '')
  }

  error(message: string, error?: unknown, options?: LoggerOptions): void {
    const formatted = this.formatMessage('error', message, options)
    console.error(formatted, error, options?.data || '')
  }

  debug(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, options)
      console.log(formatted, options?.data || '')
    }
  }
}

export const logger = new Logger()
