import { AiAnalysisLog, Prisma } from '@prisma/client';

function toNullableNumber(value: Prisma.Decimal | null): number | null {
  return value ? Number(value) : null;
}

/** 外部AI分析APIと同じレスポンス形状(success/message/estimated_data)に整形する */
export function toAnalyzeResponseBody(log: AiAnalysisLog) {
  return {
    id: log.id,
    success: log.success,
    message: log.message,
    estimated_data: log.success
      ? {
          class: log.class,
          confidence: toNullableNumber(log.confidence),
        }
      : {},
  };
}

export function toAnalysisLogDto(log: AiAnalysisLog) {
  return {
    id: log.id,
    imagePath: log.imagePath,
    success: log.success,
    message: log.message,
    class: log.class,
    confidence: toNullableNumber(log.confidence),
    requestTimestamp: log.requestTimestamp,
    responseTimestamp: log.responseTimestamp,
  };
}
