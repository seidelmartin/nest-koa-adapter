import { Controller, Get } from '@nestjs/common';
import { Observable, of } from 'rxjs';

type HelloWorld = { hello: string };

@Controller('hello')
export class HelloWorldController {
  @Get('world/sync')
  helloSync(): HelloWorld {
    return { hello: 'world-sync' };
  }

  @Get('world/async')
  async helloAsync(): Promise<HelloWorld> {
    return { hello: 'world-async' };
  }

  @Get('world/observable')
  helloObservable(): Observable<HelloWorld> {
    return of({ hello: 'world-observable' });
  }
}
