import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestKoaApplication } from '../src/NestKoaApplication';
import { KoaAdapter } from '../src/KoaAdapter';
import { HelloWorldController } from './utils/HelloWorldController';
import { DummyController } from './utils/DummyController';
import supertest from 'supertest';
import {
  koaToNestMiddleware,
  NestKoaFunctionalMiddleware,
  NestKoaMiddleware,
} from '../src/NestKoaMiddleware';
import * as Koa from 'koa';

const SCOPED_VALUE = 'scoped_value';
const GLOBAL_VALUE = 'global_value';
const CONVERTED_VALUE = 'converted_value';

const scopedMiddleware: NestKoaFunctionalMiddleware = (req, res, next) =>
  (res.body = SCOPED_VALUE);

class ScopedMiddleware implements NestKoaMiddleware {
  use(req: Koa.Request, res: Koa.Response, next: Koa.Next) {
    res.body = SCOPED_VALUE;
  }
}

const globalMiddleware: NestKoaFunctionalMiddleware = (req, res, next) =>
  (res.body = GLOBAL_VALUE);

const convertedMiddleware: NestKoaFunctionalMiddleware = koaToNestMiddleware(
  (ctx, next) => (ctx.body = CONVERTED_VALUE),
);

@Module({
  controllers: [HelloWorldController, DummyController],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ScopedMiddleware)
      .forRoutes(HelloWorldController)
      .apply(convertedMiddleware)
      .forRoutes({ path: '/dummy/p(.*)st', method: RequestMethod.POST })
      .apply(globalMiddleware)
      .forRoutes('(.*)');
  }
}

describe('Middleware', () => {
  let app: NestKoaApplication;

  beforeEach(async () => {
    app = (
      await Test.createTestingModule({
        imports: [TestModule],
      }).compile()
    ).createNestApplication<NestKoaApplication>(new KoaAdapter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it(`apply middleware for whole controller`, () => {
    return supertest(app.getHttpServer())
      .get('/hello/world/sync')
      .expect(200)
      .expect(SCOPED_VALUE);
  });

  it('apply middleware for path and method', () => {
    return supertest(app.getHttpServer())
      .post('/dummy/post')
      .expect(200)
      .expect(CONVERTED_VALUE);
  });

  it(`apply middleware for every other routes`, async () => {
    return supertest(app.getHttpServer())
      .get('/dummy/query')
      .expect(200)
      .expect(GLOBAL_VALUE);
  });
});
