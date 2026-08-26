import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { ListAnalysisLogsDto } from './dto/list-analysis-logs.dto';
import { toAnalysisLogDto, toAnalyzeResponseBody } from './analysis.presenter';

@Controller()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() dto: CreateAnalysisDto) {
    const { log, upstreamAvailable } =
      await this.analysisService.analyzeAndSave(dto.image_path);
    const body = toAnalyzeResponseBody(log);

    if (!upstreamAvailable) {
      throw new BadGatewayException(body);
    }

    return body;
  }

  @Get('analysis-logs')
  async list(@Query() query: ListAnalysisLogsDto) {
    const { items, total, page, limit } = await this.analysisService.list(
      query.page,
      query.limit,
    );
    return {
      items: items.map(toAnalysisLogDto),
      total,
      page,
      limit,
    };
  }
}
