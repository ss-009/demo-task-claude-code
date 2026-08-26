import { Injectable } from '@nestjs/common';
import { AiClientUnavailableError } from '../ai-client/ai-client.errors';
import { AiClientService } from '../ai-client/ai-client.service';
import { AnalysisRepository } from './analysis.repository';
import { AnalyzeOutcome } from './analysis.types';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly aiClient: AiClientService,
    private readonly repository: AnalysisRepository,
  ) {}

  async analyzeAndSave(imagePath: string): Promise<AnalyzeOutcome> {
    try {
      const { response, requestTimestamp, responseTimestamp } =
        await this.aiClient.analyze(imagePath);
      const log = await this.repository.create({
        imagePath,
        success: response.success,
        message: response.message,
        class: response.success ? response.estimated_data.class : null,
        confidence: response.success
          ? response.estimated_data.confidence
          : null,
        requestTimestamp,
        responseTimestamp,
      });
      return { log, upstreamAvailable: true };
    } catch (error) {
      if (error instanceof AiClientUnavailableError) {
        const log = await this.repository.create({
          imagePath,
          success: false,
          message: error.message,
          class: null,
          confidence: null,
          requestTimestamp: error.requestTimestamp,
          responseTimestamp: error.responseTimestamp,
        });
        return { log, upstreamAvailable: false };
      }
      throw error;
    }
  }

  async list(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.repository.findMany(skip, limit),
      this.repository.count(),
    ]);
    return { items, total, page, limit };
  }
}
