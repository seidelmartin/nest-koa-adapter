import { Controller, Get, HostParam } from '@nestjs/common';

type Host = { for: string };

@Controller({
  host: ':host.example.com',
})
export class HostFilterController {
  @Get('host')
  getHost(): Host {
    return { for: 'host' };
  }

  @Get('host/param')
  getHostParam(@HostParam('host') host: string): Host {
    return { for: host };
  }
}
