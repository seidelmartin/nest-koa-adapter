import { KoaAdapter, koaReply, NestKoaApplication } from '../src';
import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import {
  ArgumentsHost,
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  Inject,
  UseFilters,
} from '@nestjs/common';
import { RedirectResponse } from '@nestjs/core/router/router-response-controller';
import { HttpAdapterHost } from '@nestjs/core';
import Koa from 'koa';

@Catch()
class HttpAdapterExceptionFilter implements ExceptionFilter {
  @Inject()
  private readonly httpAdapterHost!: HttpAdapterHost;

  catch(exception: any, host: ArgumentsHost): any {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const httpArguments = host.switchToHttp();

    httpAdapter.reply(
      httpArguments.getResponse(),
      { message: exception.message },
      500,
    );
  }
}

@Catch()
class KoaReplyExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const httpArguments = host.switchToHttp();
    const response = httpArguments.getResponse<Koa.Response>();

    koaReply(response, { message: exception.message }, 500);
  }
}

@Controller('exceptionFilter')
class ExceptionController {
  @Get('httpAdapter')
  @UseFilters(HttpAdapterExceptionFilter)
  public exceptionWithHttpAdapterHost(): void {
    throw new Error('exceptionWithHttpAdapterHost');
  }

  @Get('koaReply')
  @UseFilters(KoaReplyExceptionFilter)
  public exceptionWithManualEnd(): RedirectResponse {
    throw new Error('exceptionWithKoaReply');
  }
}

describe('Exception filter', () => {
  let app: NestKoaApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExceptionController],
    }).compile();

    app = module.createNestApplication(new KoaAdapter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return response given to httpAdapter.reply', async () => {
    await supertest(app.getHttpServer())
      .get('/exceptionFilter/httpAdapter')
      .expect(500, { message: 'exceptionWithHttpAdapterHost' });
  });

  it('should return response given koaReply utility function', async () => {
    await supertest(app.getHttpServer())
      .get('/exceptionFilter/koaReply')
      .expect(500, { message: 'exceptionWithKoaReply' });
  });
});
