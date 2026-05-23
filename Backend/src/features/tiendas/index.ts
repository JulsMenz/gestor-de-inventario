import { Elysia } from 'elysia';
import { listar } from './listar/handler';
import { obtener } from './obtener/handler';

export const tiendas = new Elysia({ prefix: '/tiendas' })
	.use(listar)
	.use(obtener);
