import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, pedidos, detallePedido, productos } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

type UsuarioJWT = { id: number; nombre: string; tipo: string };

export const actualizar = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.patch('/:id', async ({ params, body, headers, jwt, status }) => {
		const token = headers['authorization']?.slice(7);
		const payload = token ? await jwt.verify(token) : null;

		if (!payload || typeof payload !== 'object' || (payload as any).tipo !== 'tendero')
			return status(401, { error: 'Solo los tenderos pueden actualizar pedidos' });

		const usuario = payload as UsuarioJWT;

		const [pedidoActual] = await conexion.select().from(pedidos).where(eq(pedidos.id, params.id));
		if (!pedidoActual) return status(404, { error: 'Pedido no encontrado' });

		if (pedidoActual.tenderoId !== null && pedidoActual.tenderoId !== usuario.id)
			return status(403, { error: 'No tienes permiso para modificar este pedido' });

		// Restaurar stock si se cancela (solo si no estaba ya cancelado)
		if (body.estado === 'cancelado' && pedidoActual.estado !== 'cancelado') {
			const items = await conexion
				.select()
				.from(detallePedido)
				.where(eq(detallePedido.pedidoId, params.id));

			await conexion.transaction(async (tx) => {
				for (const item of items) {
					const [prod] = await tx
						.select({ cantidad: productos.cantidad })
						.from(productos)
						.where(eq(productos.id, item.productoId));

					if (prod) {
						await tx
							.update(productos)
							.set({ cantidad: prod.cantidad + item.cantidad, actualizadoEn: new Date() })
							.where(eq(productos.id, item.productoId));
					}
				}
				await tx
					.update(pedidos)
					.set({ estado: body.estado, actualizadoEn: new Date() })
					.where(eq(pedidos.id, params.id));
			});
		} else {
			await conexion
				.update(pedidos)
				.set({ estado: body.estado, actualizadoEn: new Date() })
				.where(eq(pedidos.id, params.id));
		}

		const [pedidoFinal] = await conexion.select().from(pedidos).where(eq(pedidos.id, params.id));
		return pedidoFinal;
	}, {
		params: t.Object({ id: t.Numeric() }),
		body: t.Object({
			estado: t.Union([
				t.Literal('pendiente'),
				t.Literal('confirmado'),
				t.Literal('entregado'),
				t.Literal('cancelado'),
			]),
		}),
	});
