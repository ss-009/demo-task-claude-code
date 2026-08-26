import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AiClientUnavailableError } from './ai-client.errors';
import {
  AiAnalyzeResponse,
  AiClientResult,
  isValidAiAnalyzeResponse,
} from './ai-response.types';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);

  constructor(private readonly httpService: HttpService) {}

  async analyze(imagePath: string): Promise<AiClientResult> {
    const requestTimestamp = new Date();

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<AiAnalyzeResponse>('/', {
          image_path: imagePath,
        }),
      );
      const responseTimestamp = new Date();

      if (!isValidAiAnalyzeResponse(data)) {
        this.logger.error(
          `AI analysis API returned a malformed response for "${imagePath}": ${JSON.stringify(data)}`,
        );
        throw new AiClientUnavailableError(
          'Error:INVALID_RESPONSE',
          requestTimestamp,
          responseTimestamp,
        );
      }

      return { response: data, requestTimestamp, responseTimestamp };
    } catch (error) {
      if (error instanceof AiClientUnavailableError) {
        throw error;
      }
      const responseTimestamp = new Date();
      const reason = this.describeError(error);
      this.logger.error(
        `AI analysis API request failed for "${imagePath}": ${reason}`,
      );
      throw new AiClientUnavailableError(
        reason,
        requestTimestamp,
        responseTimestamp,
      );
    }
  }

  private describeError(error: unknown): string {
    if (isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return 'Error:TIMEOUT';
      }
      if (error.response) {
        return `Error:HTTP_${error.response.status}`;
      }
      return 'Error:CONNECTION_ERROR';
    }
    return 'Error:UNKNOWN';
  }
}
