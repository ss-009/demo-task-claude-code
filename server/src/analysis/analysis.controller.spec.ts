import { BadGatewayException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  const service = { analyzeAndSave: jest.fn(), list: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: service }],
    }).compile();
    controller = moduleRef.get(AnalysisController);
  });

  it('returns the analysis response body when the upstream call succeeded', async () => {
    service.analyzeAndSave.mockResolvedValue({
      log: {
        id: 1,
        success: true,
        message: 'success',
        class: 3,
        confidence: 0.8683,
      },
      upstreamAvailable: true,
    });

    const result = await controller.analyze({ image_path: '/image/test.jpg' });

    expect(result).toEqual({
      id: 1,
      success: true,
      message: 'success',
      estimated_data: { class: 3, confidence: 0.8683 },
    });
  });

  it('throws BadGatewayException when the upstream API is unreachable', async () => {
    service.analyzeAndSave.mockResolvedValue({
      log: {
        id: 2,
        success: false,
        message: 'Error:CONNECTION_ERROR',
        class: null,
        confidence: null,
      },
      upstreamAvailable: false,
    });

    await expect(
      controller.analyze({ image_path: '/image/test.jpg' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps listed logs into the paginated response', async () => {
    service.list.mockResolvedValue({
      items: [
        {
          id: 1,
          imagePath: '/a.jpg',
          success: true,
          message: 'success',
          class: 1,
          confidence: 0.5,
          requestTimestamp: new Date(),
          responseTimestamp: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await controller.list({ page: 1, limit: 20 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 1, imagePath: '/a.jpg' });
  });
});
