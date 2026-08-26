/**
 * 外部AI分析APIへの疎通自体が失敗した場合(タイムアウト・接続エラー等)に投げる。
 * API仕様上のFailureレスポンス(success: false)とは区別する。
 */
export class AiClientUnavailableError extends Error {
  constructor(
    message: string,
    public readonly requestTimestamp: Date,
    public readonly responseTimestamp: Date,
  ) {
    super(message);
    this.name = 'AiClientUnavailableError';
  }
}
