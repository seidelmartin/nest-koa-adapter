import { Controller, Get } from '@nestjs/common';
import { of } from 'rxjs';

@Controller('hello')
export class HelloWorldController {
  @Get('world/sync')
  helloSync() {
    return { hello: 'world-sync' };
  }

  @Get('world/async')
  async helloAsync() {
    return { hello: 'world-async' };
  }

  @Get('world/observable')
  helloObservable() {
    return of({ hello: 'world-observable' });
  }
}
