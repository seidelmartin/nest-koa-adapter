import { INestApplication } from '@nestjs/common';
import { Middleware } from 'koa';
import { Options as ServeStaticOptions } from 'koa-static';

export interface NestKoaApplication extends INestApplication {
  use(...middleware: Middleware[]): this;

  useStaticAssets(path: string, options?: ServeStaticOptions): this;
}
