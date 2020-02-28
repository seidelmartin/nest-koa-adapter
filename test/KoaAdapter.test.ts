import 'reflect-metadata';
import { KoaAdapter } from '../src/KoaAdapter';
import { Test } from '@nestjs/testing'
import supertest from 'supertest'
import { NestKoaApplication } from '../src/NestKoaApplication';
import { HelloWorldController } from './utils/HelloWorldController';
import { HostFilterController } from './utils/HostFilterController';
import { DummyController } from './utils/DummyController';

describe(KoaAdapter.name, () => {
	let app: NestKoaApplication;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			controllers: [HelloWorldController, HostFilterController, DummyController]
		}).compile();

		app = module.createNestApplication(new KoaAdapter());

		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	describe('Simple requests', () => {
		it('/GET sync', async () => {
			return supertest(app.getHttpServer()).get('/hello/world/sync')
				.expect(200)
				.expect({
					hello: 'world-sync'
				})
		})

		it('/GET async', async () => {
			return supertest(app.getHttpServer()).get('/hello/world/async')
				.expect(200)
				.expect({
					hello: 'world-async'
				})
		})

		it('/GET observable', async () => {
			return supertest(app.getHttpServer()).get('/hello/world/observable')
				.expect(200)
				.expect({
					hello: 'world-observable'
				})
		})
	});

	describe('Host filtering', () => {
		it('/GET host - returns 404 if not set', async () => {
			return supertest(app.getHttpServer()).get('/host')
				.expect(404)
		})

		it('/GET host - returns data if host set', async () => {
			return supertest(app.getHttpServer()).get('/host')
				.set('Host', 'admin.example.com')
				.expect(200)
				.expect({
					for: 'host'
				})
		})

		it('/GET host - returns data if host set', async () => {
			return supertest(app.getHttpServer()).get('/host/param')
				.set('Host', 'admin.example.com')
				.expect(200)
				.expect({
					for: 'admin'
				})
		})
	});

	describe('Request properties decorators', () => {
		it('properly parses query params', async () => {
			return supertest(app.getHttpServer()).get('/dummy/query')
				.query({
					test: 'value'
				})
				.expect(200)
				.expect({
					test: 'value'
				})
		});

		it('properly parses body params', async () => {
			return supertest(app.getHttpServer()).post('/dummy/post')
				.send({
					test: 'value'
				})
				.expect(201)
				.expect({
					test: 'value'
				})
		});

		it('properly gives url params', async () => {
			return supertest(app.getHttpServer()).put('/dummy/param')
				.expect(200)
				.expect('param')
		})
	});
});
