import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, productos } = database;

export const editar = new Elysia()

	.patch('/:id', async ({ params, body, status }) =>
	{
		const [producto] = await conexion.update(productos).set({ ...body, actualizadoEn: new Date() }).where(eq(productos.id, params.id)).returning();

		if (!producto) return status(404, { error: 'Producto no encontrado' });

		return status(200, producto);
	}, {
		params: t.Object({ id: t.Numeric() }),
		body: t.Object({
			nombre: t.Optional(t.String()),
			descripcion: t.Optional(t.String()),
			precio: t.Optional(t.Number()),
			cantidad: t.Optional(t.Integer()),
			categoriaId: t.Optional(t.Integer()),
		}),
	});