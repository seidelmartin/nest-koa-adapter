import koaViews from 'koa-views';

type ViewsOptions = Exclude<Parameters<typeof koaViews>[1], undefined>;

export interface KoaViewsOptions extends Omit<ViewsOptions, 'autoRender'> {
  viewsDir: string;
}
