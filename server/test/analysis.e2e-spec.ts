process.env.DATABASE_URL = 'mysql://app:app@localhost:3306/demo_task_test';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AiClientService } from '../src/ai-client/ai-client.service';
import { AiClientUnavailableError } from '../src/ai-client/ai-client.errors';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Analysis (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const aiClientMock = { analyze: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AiClientService)
      .useValue(aiClientMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    aiClientMock.analyze.mockReset();
    await prisma.aiAnalysisLog.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('saves a success response and returns the estimated data', async () => {
    aiClientMock.analyze.mockResolvedValue({
      response: {
        success: true,
        message: 'success',
        estimated_data: { class: 3, confidence: 0.8683 },
      },
      requestTimestamp: new Date(),
      responseTimestamp: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/analyze')
      .send({ image_path: '/image/test.jpg' })
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      message: 'success',
      estimated_data: { class: 3, confidence: 0.8683 },
    });

    const rows = await prisma.aiAnalysisLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      imagePath: '/image/test.jpg',
      success: true,
      class: 3,
    });
  });

  it('saves a domain-level failure response and returns it as-is', async () => {
    aiClientMock.analyze.mockResolvedValue({
      response: { success: false, message: 'Error:E50012', estimated_data: {} },
      requestTimestamp: new Date(),
      responseTimestamp: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/analyze')
      .send({ image_path: '/image/fail.jpg' })
      .expect(200);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Error:E50012',
      estimated_data: {},
    });
  });

  it('returns 502 but still logs the failure when the upstream API is unreachable', async () => {
    aiClientMock.analyze.mockRejectedValue(
      new AiClientUnavailableError(
        'Error:CONNECTION_ERROR',
        new Date(),
        new Date(),
      ),
    );

    const res = await request(app.getHttpServer())
      .post('/analyze')
      .send({ image_path: '/image/unreachable.jpg' })
      .expect(502);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Error:CONNECTION_ERROR',
    });

    const rows = await prisma.aiAnalysisLog.findMany();
    expect(rows).toHaveLength(1);
  });

  it('rejects a request without image_path', async () => {
    await request(app.getHttpServer()).post('/analyze').send({}).expect(400);
    expect(aiClientMock.analyze).not.toHaveBeenCalled();
  });

  it('lists saved logs with pagination', async () => {
    aiClientMock.analyze.mockResolvedValue({
      response: {
        success: true,
        message: 'success',
        estimated_data: { class: 1, confidence: 0.5 },
      },
      requestTimestamp: new Date(),
      responseTimestamp: new Date(),
    });
    await request(app.getHttpServer())
      .post('/analyze')
      .send({ image_path: '/image/a.jpg' });
    await request(app.getHttpServer())
      .post('/analyze')
      .send({ image_path: '/image/b.jpg' });

    const res = await request(app.getHttpServer())
      .get('/analysis-logs?limit=10')
      .expect(200);

    const body = res.body as { total: number; items: unknown[] };
    expect(body.total).toBe(2);
    expect(body.items).toHaveLength(2);
  });
});
