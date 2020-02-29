import { AbstractHttpAdapter } from '@nestjs/core';
import { NestApplicationOptions, RequestMethod } from '@nestjs/common';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import koaBodyBarser from 'koa-bodyparser';
import * as http from 'http';
import * as https from 'https';
import { RequestHandler } from '@nestjs/common/interfaces';

type HttpMethods =
  | 'all'
  | 'delete'
  | 'get'
  | 'head'
  | 'options'
  | 'patch'
  | 'post'
  | 'put';
type KoaRouteMethods = KoaRouter[HttpMethods];
type KoaHandler = RequestHandler<Koa.Request, Koa.Response>;

export class KoaAdapter extends AbstractHttpAdapter<
  http.Server | https.Server,
  Koa.Request,
  Koa.Response
> {
  private readonly router: KoaRouter;

  constructor(instance: Koa = new Koa()) {
    super(instance);

    this.router = new KoaRouter();
    instance.use(this.router.routes());
  }

  public delete(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.delete(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public get(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.get(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public head(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.head(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public options(
    pathOrHandler: string | KoaHandler,
    handler?: KoaHandler,
  ): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.options(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public patch(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.patch(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public post(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.post(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public put(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.router.put(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  private getRouteAndHandler(
    pathOrHandler: string | KoaHandler,
    handler?: KoaHandler,
  ): [string, KoaHandler] {
    let path = pathOrHandler;

    if (typeof pathOrHandler === 'function') {
      handler = pathOrHandler;
      path = '';
    }

    return [path as string, handler as KoaHandler];
  }

  public close() {
    return new Promise(resolve => this.httpServer.close(resolve));
  }

  public getType(): string {
    return 'koa';
  }

  public initHttpServer(options: NestApplicationOptions) {
    if (options?.httpsOptions) {
      this.httpServer = https.createServer(
        options.httpsOptions,
        this.getInstance<Koa>().callback(),
      );
      return;
    }
    this.httpServer = http.createServer(this.getInstance<Koa>().callback());
  }

  public useStaticAssets(...args: any[]): any {
    // TODO https://www.npmjs.com/package/koa-static
  }

  public setViewEngine(engine: string): any {
    // TODO https://www.npmjs.com/package/koa-views
  }

  public getRequestHostname(request: any) {
    return request.hostname;
  }

  public getRequestMethod(request: any): string {
    return request.method;
  }

  public getRequestUrl(request: any): string {
    return request.url;
  }

  public status(response: any, statusCode: number): any {
    response.status = statusCode;
  }

  public reply(response: any, body: any, statusCode?: number) {
    response.body = body;
    if (statusCode) {
      response.status = statusCode;
    }
  }

  public render(response: any, view: string, options: any): any {
    // TODO
  }

  public redirect(response: any, statusCode: number, url: string): any {
    response.status = statusCode;
    response.redirect(url);
  }

  public setErrorHandler(
    handler: (err: Error, ctx: Koa.Context) => void,
    prefix?: string,
  ): any {
    this.getInstance<Koa>().on('error', handler);
  }

  public setNotFoundHandler(handler: Function, prefix?: string): any {
    // TODO
  }

  public setHeader(response: any, name: string, value: string): any {
    response.set(name, value);
  }

  public registerParserMiddleware(prefix?: string): any {
    this.router.use(
      koaBodyBarser(),
      // This is because nest expects params in request object so we need to extend it
      async (ctx, next) => {
        Object.assign(ctx.request, { params: ctx.params });
        await next();
      },
    );
  }

  public enableCors(options: any): any {
    // TODO
  }

  public createMiddlewareFactory(
    requestMethod: RequestMethod,
  ): (path: string, callback: Function) => any {
    return (path: string, callback: Function) => {
      const routeMethodsMap: Record<RequestMethod, KoaRouteMethods> = {
        [RequestMethod.ALL]: this.router.all,
        [RequestMethod.DELETE]: this.router.delete,
        [RequestMethod.GET]: this.router.get,
        [RequestMethod.HEAD]: this.router.head,
        [RequestMethod.OPTIONS]: this.router.options,
        [RequestMethod.PATCH]: this.router.patch,
        [RequestMethod.POST]: this.router.post,
        [RequestMethod.PUT]: this.router.put,
      };

      const routeMethod = (
        routeMethodsMap[requestMethod] || routeMethodsMap[RequestMethod.GET]
      ).bind(this.router);

      return routeMethod(path, (ctx: Koa.Context, next: Koa.Next) =>
        callback(ctx.request, ctx.response, next),
      );
    };
  }
}
