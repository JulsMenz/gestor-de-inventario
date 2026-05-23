import { Elysia, t } from 'elysia';
import { asc, eq, and, isNull } from 'drizzle-orm';
import { database } from '../../../shared';

const { categorias, conexion } = database;

export const listar = new Elysia()
	.get('/', async ({ query, status }) => {
		const conditions = [];

		if (query.tenderoId) {
			conditions.push(eq(categorias.tenderoId, query.tenderoId));
		} else {
			conditions.push(isNull(categorias.tenderoId));
		}

		const lista = await conexion
			.select()
			.from(categorias)
			.where(and(...conditions))
			.orderBy(asc(categorias.nombre));

		return status(200, lista);
	}, {
		query: t.Object({
			tenderoId: t.Optional(t.Numeric()),
		}),
	});
