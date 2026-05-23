import { Elysia } from 'elysia';
import { crear } from './crear/handler';
import { editar } from './editar/handler';
import { eliminar } from './eliminar/handler';
import { listar } from './listar/handler';

export const categorias = new Elysia({ prefix: '/categorias' })
	.use(crear)
	.use(editar)
	.use(eliminar)
	.use(listar);
