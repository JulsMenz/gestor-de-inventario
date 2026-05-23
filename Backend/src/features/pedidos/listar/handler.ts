import { Elysia } from 'elysia';
import { jwt } from '@elysia/jwt';
import { eq, desc } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, pedidos, detallePedido, productos } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

type UsuarioJWT = { id: number; tipo: string };

export const listar = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.get('/', async ({ headers, jwt, status }) => {
		const token = headers['authorization']?.slice(7);
		const payload = token ? await jwt.verify(token) : null;

		if (!payload || typeof payload !== 'object' || (payload as any).tipo !== 'tendero')
			return status(401, { error: 'Solo los tenderos pueden ver los pedidos' });

		const usuario = payload as UsuarioJWT;

		// Solo los pedidos de esta tienda
		const listaPedidos = await conexion
			.select()
			.from(pedidos)
			.where(eq(pedidos.tenderoId, usuario.id))
			.orderBy(desc(pedidos.creadoEn));

		const resultado = await Promise.all(
			listaPedidos.map(async (p) => {
				const items = await conexion
					.select({
						id: detallePedido.id,
						productoId: detallePedido.productoId,
						nombreProducto: productos.nombre,
						cantidad: detallePedido.cantidad,
						precioUnitario: detallePedido.precioUnitario,
						subtotal: detallePedido.subtotal,
					})
					.from(detallePedido)
					.leftJoin(productos, eq(detallePedido.productoId, productos.id))
					.where(eq(detallePedido.pedidoId, p.id));

				return { ...p, items };
			})
		);

		return resultado;
	});
