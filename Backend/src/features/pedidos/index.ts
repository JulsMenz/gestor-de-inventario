import { Elysia } from 'elysia';
import { crear } from './crear/handler';
import { listar } from './listar/handler';
import { actualizar } from './actualizar/handler';

export const pedidosFeature = new Elysia({ prefix: '/pedidos' })
	.use(crear)
	.use(listar)
	.use(actualizar);
