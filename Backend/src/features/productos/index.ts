import { Elysia } from 'elysia';
import { crear } from './crear/handler';
import { editar } from './editar/handler';
import { eliminar } from './eliminar/handler';
import { listar } from './listar/handler';
import { obtener } from './obtener/handler';

export const productos = new Elysia({ prefix: '/productos' })
	.use(crear)
	.use(editar)
	.use(eliminar)
	.use(listar)
	.use(obtener);