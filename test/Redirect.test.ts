import { KoaAdapter, NestKoaApplication } from '../src';
import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { Controller, Get, Redirect } from '@nestjs/common';
import { RedirectResponse } from '@nestjs/core/router/router-response-controller';

@Controller('redirect')
class RedirectController {
  @Get()
  @Redirect('https://www.google.com', 301)
  public redirect(): void {
    return;
  }

  @Get('withParams')
  @Redirect('')
  public redirectParams(): RedirectResponse {
    return {
      statusCode: 301,
      url: 'https://www.redirect.com',
    };
  }
}

describe('Redirect', () => {
  let app: NestKoaApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [RedirectController],
    }).compile();

    app = module.createNestApplication(new KoaAdapter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return redirect', async () => {
    await supertest(app.getHttpServer())
      .get('/redirect')
      .expect(301)
      .expect('Location', 'https://www.google.com');
  });

  it('should return rendered template with variables', async () => {
    await supertest(app.getHttpServer())
      .get('/redirect/withParams')
      .expect(301)
      .expect('Location', 'https://www.redirect.com');
  });
});
