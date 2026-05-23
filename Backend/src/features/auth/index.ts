import { Elysia } from 'elysia';
import { registro } from './registro/handler';
import { login } from './login/handler';

export const auth = new Elysia({ prefix: '/auth' })
	.use(registro)
	.use(login);
