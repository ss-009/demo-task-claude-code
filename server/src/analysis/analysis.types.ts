import { AiAnalysisLog } from '@prisma/client';

export interface AnalyzeOutcome {
  log: AiAnalysisLog;
  /** 外部AI分析APIとの疎通自体に失敗した場合(タイムアウト・接続エラー等)は false */
  upstreamAvailable: boolean;
}
