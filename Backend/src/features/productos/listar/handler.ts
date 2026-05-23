import { Elysia, t } from 'elysia';
import { eq, ilike, and } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, categorias, productos } = database;

export const listar = new Elysia()
	.get('/', async ({ query }) =>
	{
		const conditions = [eq(productos.activo, true)];

		if (query.categoriaId) conditions.push(eq(productos.categoriaId, query.categoriaId));
		if (query.buscar) conditions.push(ilike(productos.nombre, `%${query.buscar}%`));
		if (query.tenderoId) conditions.push(eq(productos.tenderoId, query.tenderoId));

		return conexion
			.select({
				id: productos.id,
				nombre: productos.nombre,
				descripcion: productos.descripcion,
				precio: productos.precio,
				cantidad: productos.cantidad,
				categoriaId: productos.categoriaId,
				tenderoId: productos.tenderoId,
				categoria: categorias.nombre,
			})
			.from(productos)
			.leftJoin(categorias, eq(productos.categoriaId, categorias.id))
			.where(and(...conditions))
			.orderBy(productos.nombre);
	}, {
		query: t.Object({
			categoriaId: t.Optional(t.Numeric()),
			buscar: t.Optional(t.String()),
			tenderoId: t.Optional(t.Numeric()),
		}),
	});

