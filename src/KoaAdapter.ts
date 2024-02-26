import { AbstractHttpAdapter } from '@nestjs/core';
import {
  NestApplicationOptions,
  NestMiddleware,
  RequestMethod,
  VersioningOptions,
} from '@nestjs/common';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import koaBodyBarser from 'koa-bodyparser';
import * as http from 'http';
import * as https from 'https';
import { RequestHandler, VersionValue } from '@nestjs/common/interfaces';
import { nestToKoaMiddleware } from './NestKoaMiddleware';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { KoaCorsOptions } from './KoaCorsOptions';
import { Options as ServeStaticOptions } from 'koa-static';
import { KoaViewsOptions } from './KoaViews';
import { koaReply } from './KoaReply';

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
      this.createRouteHandler(routeHandler),
    );
  }

  public get(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().get(
      routePath,
      this.createRouteHandler(routeHandler),
    );
  }

  public head(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().head(
      routePath,
      this.createRouteHandler(routeHandler),
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
      this.createRouteHandler(routeHandler),
    );
  }

  public patch(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().patch(
      routePath,
      this.createRouteHandler(routeHandler),
    );
  }

  public post(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().post(
      routePath,
      this.createRouteHandler(routeHandler),
    );
  }

  public put(pathOrHandler: string | KoaHandler, handler?: KoaHandler): any {
    const [routePath, routeHandler] = this.getRouteAndHandler(
      pathOrHandler,
      handler,
    );

    return this.getRouter().put(
      routePath,
      this.createRouteHandler(routeHandler),
    );
  }

  private createRouteHandler(routeHandler: KoaHandler) {
    return (ctx: Koa.ParameterizedContext, next: Koa.Next) => {
      ctx.respond = false;
      routeHandler(ctx.request, ctx.response, next);
    };
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

  public close(): Promise<void> {
    return new Promise((resolve) => this.httpServer.close(() => resolve()));
  }

  public getType(): string {
    return 'koa';
  }

  public initHttpServer(options: NestApplicationOptions): void {
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

  public setViewEngine(options: KoaViewsOptions | any): any {
    const viewsMiddleware = loadPackage(
      'koa-views',
      'KoaAdapter.setViewEngine()',
    );

    const { viewsDir, ...viewsOptions } = options as KoaViewsOptions;

    this.getInstance<Koa>().use(
      viewsMiddleware(viewsDir, { autoRender: false, ...viewsOptions }),
    );
  }

  public getRequestHostname(request: Koa.Request): string {
    return request.hostname;
  }

  public getRequestMethod(request: Koa.Request): string {
    return request.method;
  }

  public getRequestUrl(request: Koa.Request): string {
    return request.url;
  }

  public status(response: Koa.Response, statusCode: number): any {
    response.status = statusCode;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public reply(response: Koa.Response, body: any, statusCode?: number) {
    return koaReply(response, body, statusCode);
  }

  public async render(
    response: Koa.Response,
    view: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    options: any,
  ): Promise<void> {
    const body = await response.ctx.render(view, options);

    this.reply(response, body);
  }

  public redirect(
    response: Koa.Response,
    statusCode: number,
    url: string,
  ): any {
    response.set('Location', url);

    return koaReply(response, null, statusCode);
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

  public setHeader(response: Koa.Response, name: string, value: string): any {
    response.set(name, value);
  }

  public registerParserMiddleware(prefix?: string): any {
    this.getRouter().use(koaBodyBarser(), async (ctx, next) => {
      // This is because nest expects params in request object so we need to extend it
      Object.assign(ctx.request, { params: ctx.params });
      await next();
    });
  }

  public enableCors(options: CorsOptions): void {
    const corsMiddleware = loadPackage('@koa/cors', 'KoaAdapter.enableCors()');

    KoaCorsOptions.validateNestOptions(options);

    const koaCorsOptions = new KoaCorsOptions(options);

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
    // eslint-disable-next-line @typescript-eslint/ban-types
  ): (path: string, middleware: Function) => any {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return (path: string, middleware: Function) => {
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

      return routeMethod(
        path,
        (ctx: Koa.ParameterizedContext, next: Koa.Next) =>
          middleware(ctx.request, ctx.response, next),
      );
    };
  }

  public applyVersionFilter(
    handler: (...args: any[]) => any,
    version: VersionValue,
    versioningOptions: VersioningOptions,
  ): (
    req: Koa.Request,
    res: Koa.Response,
    next: () => void,
  ) => (...args: any[]) => any {
    throw new Error('Versioning not yet supported in Koa');
  }

  public end(response: Koa.Response, message: string | undefined): any {
    response.res.end(message);
  }

  public isHeadersSent(response: Koa.Response): any {
    return response.headerSent;
  }
}
