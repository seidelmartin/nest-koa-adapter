import { KoaAdapter, NestKoaApplication } from '../src';
import { join } from 'path';
import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { Controller, Get, Render } from '@nestjs/common';

@Controller('views')
class ViewsController {
  @Get()
  @Render('index')
  public index() {
    return {};
  }

  @Get('greeting')
  @Render('greeting')
  public greeting() {
    return { whoever: 'Martin' };
  }
}

describe('Views', () => {
  let app: NestKoaApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ViewsController],
    }).compile();

    app = module.createNestApplication(new KoaAdapter());
    app.setViewEngine({
      viewsDir: join(__dirname, 'sample-data/views'),
      map: {
        html: 'lodash',
      },
    });

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return rendered template', async () => {
    await supertest(app.getHttpServer()).get('/views').expect(
      200,
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hello World</title>
</head>
<body>
Hello world
</body>
</html>`,
    );
  });

  it('should return rendered template with variables', async () => {
    await supertest(app.getHttpServer()).get('/views/greeting').expect(
      200,
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Greeting</title>
</head>
<body>
Hello Martin
</body>
</html>`,
    );
  });
});
