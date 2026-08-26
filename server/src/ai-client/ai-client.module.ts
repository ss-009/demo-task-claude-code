import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClientService } from './ai-client.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('AI_API_BASE_URL'),
        timeout: config.get<number>('AI_API_TIMEOUT_MS', 5000),
      }),
    }),
  ],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
