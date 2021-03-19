import Koa, { Context } from 'koa';
import KoaRouter from 'koa-router';
import { Options } from '@koa/cors';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type OriginResolver = (ctx: Context) => string;

export class KoaCorsOptions implements Options {
  readonly allowHeaders?: string[] | string;
  readonly allowMethods?: string[] | string;
  readonly credentials?: boolean;
  readonly exposeHeaders?: string[] | string;
  readonly maxAge?: number | string;
  readonly origin?: OriginResolver;

  public static validateNestOptions(options: CorsOptions = {}): void {
    if (typeof options.origin === 'function') {
      throw new Error(
        `KoaNestAdapter doesn't support CustomOrigin type as origin option.`,
      );
    }
  }

  constructor(nestOptions: CorsOptions) {
    this.allowMethods = nestOptions.methods;
    this.allowHeaders = nestOptions.allowedHeaders;
    this.exposeHeaders = nestOptions.exposedHeaders;
    this.credentials = nestOptions.credentials;
    this.maxAge = nestOptions.maxAge;
    this.origin = this.createOriginResolver(nestOptions);
  }

  private createOriginResolver(
    nestOptions: CorsOptions,
  ): OriginResolver | undefined {
    const { origin } = nestOptions;

    if (!origin) {
      return;
    }

    return (ctx: Koa.Context) => {
      const requestOrigin = ctx.get('Origin');

      if (origin === true) {
        return requestOrigin;
      }

      const origins = Array.isArray(origin) ? origin : [origin];

      const matches = origins.some((o) => {
        if (typeof o === 'string') {
          return o === requestOrigin;
        }

        if (o instanceof RegExp) {
          return o.test(requestOrigin);
        }

        return false;
      });

      if (!matches) {
        return '';
      }

      return requestOrigin;
    };
  }

  public handleOptionsSuccessStatus(
    koa: Koa | KoaRouter,
    nestOptions: CorsOptions = {},
  ): void {
    const { optionsSuccessStatus } = nestOptions;

    if (!optionsSuccessStatus) {
      return;
    }

    koa.use(async (ctx: Koa.ParameterizedContext, next: Koa.Next) => {
      await next();

      if (
        ctx.method === 'OPTIONS' &&
        ctx.get('Access-Control-Request-Method')
      ) {
        ctx.status = optionsSuccessStatus;
      }
    });
  }
}
