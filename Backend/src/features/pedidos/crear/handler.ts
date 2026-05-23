import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { eq, inArray, and } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, productos, pedidos, detallePedido } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

type UsuarioJWT = { id: number; nombre: string; tipo: string };

export const crear = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.post('/', async ({ body, headers, jwt, status }) => {
		const token = headers['authorization']?.slice(7);
		const payload = token ? await jwt.verify(token) : null;
		const usuarioAuth = (payload && typeof payload === 'object') ? payload as UsuarioJWT : null;

		const productoIds = body.items.map((i) => i.productoId);

		const productosDB = await conexion
			.select()
			.from(productos)
			.where(and(inArray(productos.id, productoIds), eq(productos.activo, true)));

		// Validar stock
		for (const item of body.items) {
			const prod = productosDB.find((p) => p.id === item.productoId);
			if (!prod) return status(404, { error: `Producto con id ${item.productoId} no encontrado` });
			if (prod.cantidad < item.cantidad)
				return status(400, {
					error: `Stock insuficiente para "${prod.nombre}". Disponibles: ${prod.cantidad}`,
				});
		}

		const nombreContacto = body.nombreContacto?.trim() || usuarioAuth?.nombre || 'Invitado';

		// Agrupar items por tenderoId para crear un pedido por tienda
		const itemsPorTendero = new Map<number | null, typeof body.items>();
		for (const item of body.items) {
			const prod = productosDB.find((p) => p.id === item.productoId)!;
			const tid = prod.tenderoId;
			if (!itemsPorTendero.has(tid)) itemsPorTendero.set(tid, []);
			itemsPorTendero.get(tid)!.push(item);
		}

		const pedidosCreados = await conexion.transaction(async (tx) => {
			const resultado = [];

			for (const [tenderoId, items] of itemsPorTendero) {
				const total = items.reduce((sum, item) => {
					const prod = productosDB.find((p) => p.id === item.productoId)!;
					return sum + prod.precio * item.cantidad;
				}, 0);

				const [pedido] = await tx
					.insert(pedidos)
					.values({
						clienteId: usuarioAuth?.id ?? null,
						tenderoId,
						nombreContacto,
						telefonoContacto: body.telefonoContacto ?? null,
						total,
						estado: 'pendiente',
					})
					.returning();

				for (const item of items) {
					const prod = productosDB.find((p) => p.id === item.productoId)!;
					await tx.insert(detallePedido).values({
						pedidoId: pedido.id,
						productoId: item.productoId,
						cantidad: item.cantidad,
						precioUnitario: prod.precio,
						subtotal: prod.precio * item.cantidad,
					});
					await tx
						.update(productos)
						.set({ cantidad: prod.cantidad - item.cantidad, actualizadoEn: new Date() })
						.where(eq(productos.id, item.productoId));
				}

				resultado.push(pedido);
			}

			return resultado;
		});

		return status(201, pedidosCreados);
	}, {
		body: t.Object({
			nombreContacto: t.Optional(t.String()),
			telefonoContacto: t.Optional(t.String()),
			items: t.Array(
				t.Object({
					productoId: t.Integer(),
					cantidad: t.Integer({ minimum: 1 }),
				}),
				{ minItems: 1 }
			),
		}),
	});
