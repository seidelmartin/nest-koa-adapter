import * as Koa from 'koa';
import { NestMiddleware } from '@nestjs/common';

export type NestKoaFunctionalMiddleware = (
  req: Koa.Request,
  res: Koa.Response,
  next: Koa.Next,
) => Promise<any> | any;

export interface NestKoaMiddleware {
  use(req: Koa.Request, res: Koa.Response, next: Koa.Next): Promise<any> | any;
}

export const koaToNestMiddleware = (
  middleware: Koa.Middleware<any, any>,
): NestKoaFunctionalMiddleware => (
  req: Koa.Request,
  res: Koa.Response,
  next: Koa.Next,
) => middleware(req.ctx, next);

export const nestToKoaMiddleware = (
  middleware: NestMiddleware['use'],
): Koa.Middleware<any, any> => (ctx: Koa.Context, next: Koa.Next) =>
  middleware(ctx.request, ctx.response, next);
