# Nest Koa HTTP Adapter

This package allows to use Koa and Koa router together with Nest.js framework.

It consists of `KoaAdapter` which is basically just mapping between Nest server and Koa.
`NestKoaApplication` is an interface of application created by `NestFactory`.
`NestKoaMiddleware` and `NestKoaFunctionalMiddleware` are interfaces for writing middleware for Nest together with Koa.
`koaToNestMiddleware` is an utility function which can convert your old Koa middleware so it can be used in Nest.

### Missing parts

 - Setting view engine is not implemented
 - Rendering of static pages is not yet implemented

## How to use

#### Create application

```typescript
NestFactory.create<NestKoaApplication>(AppModule, new KoaAdapter());

// You can also pass your own instance of Koa app to the adapter
const koa = new Koa();
NestFactory.create<NestKoaApplication>(AppModule, new KoaAdapter(koa));
```

#### Middleware

You can still use your old middleware by converting by using `koaToNestMiddleware` function.

```typescript
const koaMiddleware = (ctx, next) => {
  ...
}

@Module({
  controllers: [HelloWorldController],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(koaToNestMiddleware(koaMiddleware))
      .forRoutes('*');
  }
}
```

Or you can implement class middleware by implementing `NestKoaMiddleware` interface.

```typescript
class Middleware implements NestKoaMiddleware {
  use(req: Koa.Request, res: Koa.Response, next: Koa.Next) {
    ...
  }
}

@Module({
  controllers: [HelloWorldController],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(Middleware)
      .forRoutes('*');
  }
}
```

#### CORS

To use CORS you'll have to install [`@koa/cors`](https://github.com/koajs/cors) package.

```
npm install @koa/cors
```

After installation is done you can set CORS same way as in normal NEST application.

>  The `enableCors` method accepts options same as normal Nest application. The only difference is in `origin` property which should not be function.

```typescript
const app = NestFactory.create<NestKoaApplication>(AppModule, new KoaAdapter());

app.enableCors();

await app.init();
```

#### Static assets

To use static assets you have to install [`koa-static`](https://github.com/koajs/static) package.

```
npm install koa-static
```

Once you have the dependency installed you can set you static assets folder.

```typescript
const app = NestFactory.create<NestKoaApplication>(AppModule, new KoaAdapter());

app.useStaticAssets(path.join(__dirname, 'static'));

app.useStaticAssets(path.join(__dirname, 'static'), options);

await app.init();
```

>  The `useStaticAssets` method also accepts [options](https://github.com/koajs/static#options) which are exactly same as those from `koa-static`.
