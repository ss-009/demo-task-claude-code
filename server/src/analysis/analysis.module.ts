import { Module } from '@nestjs/common';
import { AiClientModule } from '../ai-client/ai-client.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisRepository } from './analysis.repository';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [AiClientModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisRepository],
})
export class AnalysisModule {}
