import { Elysia } from 'elysia';
import { categorias } from './categorias';
import { productos } from './productos';
import { auth } from './auth';
import { pedidosFeature } from './pedidos';
import { tiendas } from './tiendas';

export const Features = new Elysia({ prefix: '/api' })
	.use(categorias)
	.use(productos)
	.use(auth)
	.use(pedidosFeature)
	.use(tiendas);
