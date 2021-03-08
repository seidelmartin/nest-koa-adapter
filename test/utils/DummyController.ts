import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';

@Controller({ path: 'dummy' })
export class DummyController {
  @Get('query')
  getQuery(@Query() query: Record<string, string>): Record<string, string> {
    return query;
  }

  @Post('post')
  getPost<T>(@Body() body: T): T {
    return body;
  }

  @Put(':param')
  getParam(@Param('param') param: string): string {
    return param;
  }
}
