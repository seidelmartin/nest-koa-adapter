import { KoaAdapter, NestKoaApplication } from '../src';
import { Test } from '@nestjs/testing';
import { HelloWorldController } from './utils/HelloWorldController';
import { join } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import supertest from 'supertest';
import assert from 'assert';

const readFile = promisify(fs.readFile);

describe.only('Static assets', () => {
  let app: NestKoaApplication;
  let file: Buffer;

  before(async () => {
    file = await readFile(join(__dirname, 'sample-data/static/image.png'));
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HelloWorldController],
    }).compile();

    app = module.createNestApplication(new KoaAdapter());
    app.useStaticAssets(join(__dirname, 'sample-data/static/'));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should serve static assets from defined folder', async () => {
    return supertest(app.getHttpServer())
      .get('/image.png')
      .expect(200)
      .expect(res => {
        assert(file.equals(res.body));
      });
  });

  it('should still serve data from endpoints', async () => {
    return supertest(app.getHttpServer())
      .get('/hello/world/sync')
      .expect(200)
      .expect({
        hello: 'world-sync',
      });
  });
});
