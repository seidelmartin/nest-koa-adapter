import {
  HttpCode,
  Controller,
  Post,
  Header,
  applyDecorators,
} from '@nestjs/common';
import { NestKoaApplication, KoaAdapter } from '../src';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { Stream, Readable } from 'stream';

const TestDecorator = (): MethodDecorator => {
  return applyDecorators(
    Header('Content-Type', 'my-content-type'),
    Header('Content-Length', '3'),
    HttpCode(280),
  );
};

@Controller('reply')
class ReplyController {
  @Post('empty')
  @TestDecorator()
  public empty(): void {
    return;
  }

  @Post('string')
  @TestDecorator()
  public string(): string {
    return 'test';
  }

  @Post('stream')
  @TestDecorator()
  public stream(): Stream {
    const stream = new Readable();
    stream.push('test');
    stream.push(null);

    return stream;
  }

  @Post('number')
  @TestDecorator()
  public number(): number {
    return 123;
  }
}

describe('Reply', () => {
  let app: NestKoaApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReplyController],
    }).compile();

    app = module.createNestApplication(new KoaAdapter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  ['empty', 'string', 'stream', 'number'].forEach((type) => {
    it(`should use HTTP status code and headers given in decorator for ${type} body`, async () => {
      const reply = await supertest(app.getHttpServer())
        .post(`/reply/${type}`)
        .buffer(true)
        .parse((res, callback) => {
          callback(null, res.text);
        })
        .expect(280)
        .expect('Content-Type', 'my-content-type')
        .expect('Content-Length', '3');
    });
  });
});
