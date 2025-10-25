/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * エラーレスポンスの生成
 */
export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
    };
  }

  // 予期しないエラー
  console.error('予期しないエラー:', error);
  return {
    error: {
      message: 'サーバーエラーが発生しました',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    },
  };
}

/**
 * エラーログ記録
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
  };

  console.error('[ERROR]', JSON.stringify(errorData, null, 2));

  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: Sentry, CloudWatch等に送信
  }
}
