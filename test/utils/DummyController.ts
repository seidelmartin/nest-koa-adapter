import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';

@Controller({ path: 'dummy' })
export class DummyController {
  @Get('query')
  getQuery(@Query() query: any) {
    return query;
  }

  @Post('post')
  getPost(@Body() body: any) {
    return body;
  }

  @Put(':param')
  getParam(@Param('param') param: string) {
    return param;
  }
}
