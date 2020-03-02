import * as Koa from 'koa';

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
