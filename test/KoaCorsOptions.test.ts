import { KoaCorsOptions } from '../src/KoaCorsOptions';
import { KoaAdapter, NestKoaApplication } from '../src';
import { Test } from '@nestjs/testing';
import { HelloWorldController } from './utils/HelloWorldController';
import { HostFilterController } from './utils/HostFilterController';
import { DummyController } from './utils/DummyController';
import supertest from 'supertest';
import assert from 'assert';

describe(KoaCorsOptions.name, () => {
  let app: NestKoaApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        HelloWorldController,
        HostFilterController,
        DummyController,
      ],
    }).compile();

    app = module.createNestApplication(new KoaAdapter());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('without options', () => {
    beforeEach(async () => {
      app.enableCors({});
      await app.init();
    });

    it('should return cors headers for all endpoints', async () => {
      return supertest(app.getHttpServer())
        .get('/hello/world/sync')
        .set('Origin', 'http://test.domain')
        .expect(200)
        .expect((res) => {
          assert.strictEqual(res.get('access-control-allow-origin'), '*');
        });
    });
  });

  describe('with options', () => {
    describe('origin option', () => {
      beforeEach(async () => {
        app.enableCors({
          origin: /test/,
        });
        await app.init();
      });

      it('should return cors headers for allowed domain', async () => {
        return supertest(app.getHttpServer())
          .get('/hello/world/sync')
          .set('Origin', 'http://test.domain')
          .expect(200)
          .expect((res) => {
            assert.strictEqual(
              res.get('access-control-allow-origin'),
              'http://test.domain',
            );
          });
      });

      it('should not return cors headers for not allowed domain', async () => {
        return supertest(app.getHttpServer())
          .get('/hello/world/sync')
          .set('Origin', 'http://not-allowed.domain')
          .expect(200)
          .expect((res) => {
            assert.strictEqual(
              res.get('access-control-allow-origin'),
              undefined,
            );
          });
      });
    });

    describe('origin option', () => {
      it('should return OPTIONS response with specified status', async () => {
        app.enableCors({
          optionsSuccessStatus: 200,
        });
        await app.init();

        return supertest(app.getHttpServer())
          .options('/hello/world/sync')
          .set('Access-Control-Request-Method', 'POST')
          .set('Origin', 'http://test.domain')
          .expect(200)
          .expect((res) => {
            assert.strictEqual(res.get('access-control-allow-origin'), '*');
          });
      });

      it('should return OPTIONS response with default 204 status', async () => {
        app.enableCors({});
        await app.init();

        return supertest(app.getHttpServer())
          .options('/hello/world/sync')
          .set('Access-Control-Request-Method', 'POST')
          .set('Origin', 'http://test.domain')
          .expect(204)
          .expect((res) => {
            assert.strictEqual(res.get('access-control-allow-origin'), '*');
          });
      });
    });
  });
});
