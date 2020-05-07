import { HttpCode, Controller, Post, Header, applyDecorators } from '@nestjs/common';
import { NestKoaApplication, KoaAdapter } from '../src';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { Stream, Readable } from 'stream';

const TestDecorator = (): MethodDecorator => {
	return applyDecorators(
    Header('Content-Type', 'my-content-type'),
    Header('Content-Length', '123'),
    Header('Transfer-Encoding', 'my-transfer-encoding'),
    HttpCode(280)
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

describe.only('Reply', () => {
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

  ['empty', 'string', 'stream', 'number'].forEach(type => {
    it(`should use HTTP status code and headers given in decorator for ${type} body`, async () => {
      await supertest(app.getHttpServer())
        .post(`/reply/${type}`)
        .expect(280)
        .expect('Content-Type', 'my-content-type')
        .expect('Content-Length', '123')
        .expect('Transfer-Encoding', 'my-transfer-encoding');
    });
  });
});
