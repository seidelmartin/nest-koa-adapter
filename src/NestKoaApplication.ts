import { INestApplication } from '@nestjs/common';
import { Middleware } from 'koa';

export interface NestKoaApplication extends INestApplication {
  use(...middleware: Middleware[]): this;
}
