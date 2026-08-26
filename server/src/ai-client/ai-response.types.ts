export interface AiEstimatedData {
  class: number;
  confidence: number;
}

export interface AiAnalyzeSuccessResponse {
  success: true;
  message: string;
  estimated_data: AiEstimatedData;
}

export interface AiAnalyzeFailureResponse {
  success: false;
  message: string;
  estimated_data: Record<string, never>;
}

export type AiAnalyzeResponse =
  AiAnalyzeSuccessResponse | AiAnalyzeFailureResponse;

export interface AiClientResult {
  response: AiAnalyzeResponse;
  requestTimestamp: Date;
  responseTimestamp: Date;
}

/** 外部AI分析APIのレスポンスが仕様通りの形状かを検証する */
export function isValidAiAnalyzeResponse(
  data: unknown,
): data is AiAnalyzeResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const body = data as Record<string, unknown>;
  if (typeof body.success !== 'boolean' || typeof body.message !== 'string') {
    return false;
  }
  if (body.success === false) {
    return true;
  }
  const estimatedData = body.estimated_data as
    Record<string, unknown> | undefined;
  return (
    typeof estimatedData === 'object' &&
    estimatedData !== null &&
    typeof estimatedData.class === 'number' &&
    typeof estimatedData.confidence === 'number'
  );
}
