import { Elysia } from "elysia";
import { cors } from '@elysia/cors';
import { staticPlugin } from '@elysia/static';
import { Features } from "./features";

const app = new Elysia()
	.use(cors())
	.use(Features)
	.get('/health', () => ({ status: 'ok' }))
	.use(staticPlugin({ assets: 'public', prefix: '/' }))
	.get('*', () => Bun.file('public/404.html'))
	.listen(8000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
