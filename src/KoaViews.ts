import koaViews from '@ladjs/koa-views';

type ViewsOptions = Exclude<Parameters<typeof koaViews>[1], undefined>;

export interface KoaViewsOptions extends Omit<ViewsOptions, 'autoRender'> {
  viewsDir: string;
}
