import { Controller, Get, HostParam } from '@nestjs/common';

@Controller({
	host: ':host.example.com'
})
export class HostFilterController {
	@Get('host')
	getHost() {
		return { for: 'host' }
	}

	@Get('host/param')
	getHostParam(@HostParam('host') host: string) {
		return { for: host }
	}

}
