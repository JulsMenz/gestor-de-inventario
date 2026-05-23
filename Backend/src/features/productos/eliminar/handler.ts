import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, productos } = database;

export const eliminar = new Elysia()
	.delete('/:id', async ({ params, status }) =>
	{
		const [producto] = await conexion.update(productos).set({ activo: false, actualizadoEn: new Date() }).where(eq(productos.id, params.id)).returning();

		if (!producto) return status(404, { error: 'Producto no encontrado' });

		return status(204, { success: true });
	}, {
		params: t.Object({ id: t.Numeric() }),
	});