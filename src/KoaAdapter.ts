import { AbstractHttpAdapter } from '@nestjs/core';
import {
  NestApplicationOptions,
  NestMiddleware,
  RequestMethod,
} from '@nestjs/common';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import koaBodyBarser from 'koa-bodyparser';
import * as http from 'http';
import * as https from 'https';
import { RequestHandler } from '@nestjs/common/interfaces';
import { nestToKoaMiddleware } from './NestKoaMiddleware';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { KoaCorsOptions } from './KoaCorsOptions';
import { Options as ServeStaticOptions } from 'koa-static';

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
  private router?: KoaRouter;

  constructor(instance: Koa = new Koa()) {
    super(instance);
  }

  private getRouter(): KoaRouter {
    if (!this.router) {
      this.router = new KoaRouter();
      this.getInstance<Koa>().use(this.router.routes());
    }

    return this.router;
  }

  public delete(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().delete(
      routePath,
      (ctx: Koa.Context, next: Koa.Next) =>
        routeHandler(ctx.request, ctx.response, next),
    );
  }

  public get(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().get(routePath, (ctx: Koa.Context, next: Koa.Next) =>
      routeHandler(ctx.request, ctx.response, next),
    );
  }

  public head(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().head(
      routePath,
      (ctx: Koa.Context, next: Koa.Next) =>
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

    return this.getRouter().options(
      routePath,
      (ctx: Koa.Context, next: Koa.Next) =>
        routeHandler(ctx.request, ctx.response, next),
    );
  }

  public patch(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().patch(
      routePath,
      (ctx: Koa.Context, next: Koa.Next) =>
        routeHandler(ctx.request, ctx.response, next),
    );
  }

  public post(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().post(
      routePath,
      (ctx: Koa.Context, next: Koa.Next) =>
        routeHandler(ctx.request, ctx.response, next),
    );
  }

  public put(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().put(routePath, (ctx: Koa.Context, next: Koa.Next) =>
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

  public useStaticAssets(path: string, options?: ServeStaticOptions): any {
    const serveStaticMiddleware = loadPackage(
      'koa-static',
      'KoaAdapter.useStaticAssets()',
    );

    this.getInstance<Koa>().use(serveStaticMiddleware(path, options));
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

  public setNotFoundHandler(
    handler: NestMiddleware['use'],
    prefix?: string,
  ): any {
    this.getInstance<Koa>().use(nestToKoaMiddleware(handler));
  }

  public setHeader(response: any, name: string, value: string): any {
    response.set(name, value);
  }

  public registerParserMiddleware(prefix?: string): any {
    this.getRouter().use(koaBodyBarser(), async (ctx, next) => {
      // This is because nest expects params in request object so we need to extend it
      Object.assign(ctx.request, { params: ctx.params });
      await next();
    });
  }

  public enableCors(options?: CorsOptions): any {
    const corsMiddleware = loadPackage('@koa/cors', 'KoaAdapter.enableCors()');

    KoaCorsOptions.validateNestOptions(options);

    const koaCorsOptions = options && new KoaCorsOptions(options);

    if (koaCorsOptions) {
      koaCorsOptions.handleOptionsSuccessStatus(
        this.getInstance<Koa>(),
        options,
      );
    }
    this.getInstance<Koa>().use(corsMiddleware(koaCorsOptions));
  }

  public createMiddlewareFactory(
    requestMethod: RequestMethod,
  ): (path: string, callback: Function) => any {
    return (path: string, callback: Function) => {
      const router = this.getRouter();

      const routeMethodsMap: Record<RequestMethod, KoaRouteMethods> = {
        [RequestMethod.ALL]: router.all,
        [RequestMethod.DELETE]: router.delete,
        [RequestMethod.GET]: router.get,
        [RequestMethod.HEAD]: router.head,
        [RequestMethod.OPTIONS]: router.options,
        [RequestMethod.PATCH]: router.patch,
        [RequestMethod.POST]: router.post,
        [RequestMethod.PUT]: router.put,
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
