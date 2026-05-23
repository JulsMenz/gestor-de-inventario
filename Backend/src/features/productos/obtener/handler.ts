import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, categorias, productos } = database;

export const obtener = new Elysia()
	.get('/:id', async ({ params, status }) =>
	{
		const [producto] = await conexion
			.select({
				id: productos.id,
				nombre: productos.nombre,
				descripcion: productos.descripcion,
				precio: productos.precio,
				cantidad: productos.cantidad,
				categoriaId: productos.categoriaId,
				categoria: categorias.nombre,
				creadoEn: productos.creadoEn,
				actualizadoEn: productos.actualizadoEn,
			})
			.from(productos)
			.leftJoin(categorias, eq(productos.categoriaId, categorias.id))
			.where(eq(productos.id, params.id));

		if (!producto) return status(404, { error: 'Producto no encontrado' });

		return status(200, producto);
	}, {
		params: t.Object({ id: t.Numeric() }),
	});