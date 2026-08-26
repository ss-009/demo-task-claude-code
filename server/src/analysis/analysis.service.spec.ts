import { Test } from '@nestjs/testing';
import { AiClientUnavailableError } from '../ai-client/ai-client.errors';
import { AiClientService } from '../ai-client/ai-client.service';
import { AnalysisRepository } from './analysis.repository';
import { AnalysisService } from './analysis.service';

describe('AnalysisService', () => {
  let service: AnalysisService;
  const aiClient = { analyze: jest.fn() };
  const repository = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: AiClientService, useValue: aiClient },
        { provide: AnalysisRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(AnalysisService);
  });

  it('saves class/confidence and reports the upstream as available on success', async () => {
    const requestTimestamp = new Date();
    const responseTimestamp = new Date();
    aiClient.analyze.mockResolvedValue({
      response: {
        success: true,
        message: 'success',
        estimated_data: { class: 3, confidence: 0.8683 },
      },
      requestTimestamp,
      responseTimestamp,
    });
    repository.create.mockResolvedValue({ id: 1 });

    const result = await service.analyzeAndSave('/image/test.jpg');

    expect(repository.create).toHaveBeenCalledWith({
      imagePath: '/image/test.jpg',
      success: true,
      message: 'success',
      class: 3,
      confidence: 0.8683,
      requestTimestamp,
      responseTimestamp,
    });
    expect(result.upstreamAvailable).toBe(true);
  });

  it('saves null class/confidence for a domain-level failure response', async () => {
    aiClient.analyze.mockResolvedValue({
      response: { success: false, message: 'Error:E50012', estimated_data: {} },
      requestTimestamp: new Date(),
      responseTimestamp: new Date(),
    });
    repository.create.mockResolvedValue({ id: 2 });

    const result = await service.analyzeAndSave('/image/test.jpg');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Error:E50012',
        class: null,
        confidence: null,
      }),
    );
    expect(result.upstreamAvailable).toBe(true);
  });

  it('still saves a failure log and reports upstream unavailable when the AI client cannot be reached', async () => {
    const requestTimestamp = new Date();
    const responseTimestamp = new Date();
    aiClient.analyze.mockRejectedValue(
      new AiClientUnavailableError(
        'Error:CONNECTION_ERROR',
        requestTimestamp,
        responseTimestamp,
      ),
    );
    repository.create.mockResolvedValue({ id: 3 });

    const result = await service.analyzeAndSave('/image/test.jpg');

    expect(repository.create).toHaveBeenCalledWith({
      imagePath: '/image/test.jpg',
      success: false,
      message: 'Error:CONNECTION_ERROR',
      class: null,
      confidence: null,
      requestTimestamp,
      responseTimestamp,
    });
    expect(result.upstreamAvailable).toBe(false);
  });

  it('rethrows unexpected errors without persisting a log', async () => {
    aiClient.analyze.mockRejectedValue(new Error('boom'));

    await expect(service.analyzeAndSave('/image/test.jpg')).rejects.toThrow(
      'boom',
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('lists logs with pagination', async () => {
    repository.findMany.mockResolvedValue([{ id: 1 }]);
    repository.count.mockResolvedValue(1);

    const result = await service.list(2, 10);

    expect(repository.findMany).toHaveBeenCalledWith(10, 10);
    expect(result).toEqual({
      items: [{ id: 1 }],
      total: 1,
      page: 2,
      limit: 10,
    });
  });
});
