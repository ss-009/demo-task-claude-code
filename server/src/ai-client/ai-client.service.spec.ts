import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { AiClientService } from './ai-client.service';

describe('AiClientService', () => {
  let service: AiClientService;
  const httpService = { post: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiClientService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();
    service = moduleRef.get(AiClientService);
  });

  it('returns the parsed response with request/response timestamps on success', async () => {
    const body = {
      success: true,
      message: 'success',
      estimated_data: { class: 3, confidence: 0.8683 },
    };
    httpService.post.mockReturnValue(of({ data: body }));

    const result = await service.analyze('/image/test.jpg');

    expect(result.response).toEqual(body);
    expect(result.requestTimestamp).toBeInstanceOf(Date);
    expect(result.responseTimestamp).toBeInstanceOf(Date);
    expect(httpService.post).toHaveBeenCalledWith('/', {
      image_path: '/image/test.jpg',
    });
  });

  it('rejects with Error:INVALID_RESPONSE when the success response is missing estimated_data', async () => {
    httpService.post.mockReturnValue(
      of({ data: { success: true, message: 'success' } }),
    );

    await expect(service.analyze('/image/test.jpg')).rejects.toMatchObject({
      name: 'AiClientUnavailableError',
      message: 'Error:INVALID_RESPONSE',
    });
  });

  it('maps ECONNABORTED to Error:TIMEOUT', async () => {
    httpService.post.mockReturnValue(
      throwError(() => new AxiosError('timeout', 'ECONNABORTED')),
    );

    await expect(service.analyze('/image/test.jpg')).rejects.toMatchObject({
      name: 'AiClientUnavailableError',
      message: 'Error:TIMEOUT',
    });
  });

  it('maps an HTTP error response to Error:HTTP_<status>', async () => {
    const error = new AxiosError('fail', undefined, undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      data: {},
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() } as never,
    });
    httpService.post.mockReturnValue(throwError(() => error));

    await expect(service.analyze('/image/test.jpg')).rejects.toMatchObject({
      message: 'Error:HTTP_500',
    });
  });

  it('maps a connection-level error (no response) to Error:CONNECTION_ERROR', async () => {
    httpService.post.mockReturnValue(
      throwError(() => new AxiosError('network', 'ECONNREFUSED')),
    );

    await expect(service.analyze('/image/test.jpg')).rejects.toMatchObject({
      message: 'Error:CONNECTION_ERROR',
    });
  });

  it('maps a non-axios error to Error:UNKNOWN', async () => {
    httpService.post.mockReturnValue(throwError(() => new Error('boom')));

    await expect(service.analyze('/image/test.jpg')).rejects.toMatchObject({
      message: 'Error:UNKNOWN',
    });
  });
});
