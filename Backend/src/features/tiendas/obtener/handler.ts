import { Elysia, t } from 'elysia';
import { eq, ilike, and } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, usuarios, productos, categorias } = database;

export const obtener = new Elysia()
	.get('/:slug', async ({ params, query, status }) => {
		const [tienda] = await conexion
			.select({
				id: usuarios.id,
				nombre: usuarios.nombre,
				nombreTienda: usuarios.nombreTienda,
				slugTienda: usuarios.slugTienda,
			})
			.from(usuarios)
			.where(eq(usuarios.slugTienda, params.slug));

		if (!tienda) return status(404, { error: 'Tienda no encontrada' });

		const conditions: ReturnType<typeof eq>[] = [
			eq(productos.tenderoId, tienda.id),
			eq(productos.activo, true),
		];
		if (query.buscar) conditions.push(ilike(productos.nombre, `%${query.buscar}%`));
		if (query.categoriaId) conditions.push(eq(productos.categoriaId, query.categoriaId));

		const prods = await conexion
			.select({
				id: productos.id,
				nombre: productos.nombre,
				descripcion: productos.descripcion,
				precio: productos.precio,
				cantidad: productos.cantidad,
				categoriaId: productos.categoriaId,
				categoria: categorias.nombre,
				tenderoId: productos.tenderoId,
			})
			.from(productos)
			.leftJoin(categorias, eq(productos.categoriaId, categorias.id))
			.where(and(...conditions))
			.orderBy(productos.nombre);

		return { tienda, productos: prods };
	}, {
		params: t.Object({ slug: t.String() }),
		query: t.Object({
			buscar: t.Optional(t.String()),
			categoriaId: t.Optional(t.Numeric()),
		}),
	});
