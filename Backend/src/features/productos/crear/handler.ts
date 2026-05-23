import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { database } from '../../../shared';

const { conexion, productos } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

type UsuarioJWT = { id: number; nombre: string; tipo: string };

export const crear = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.post('/', async ({ body, headers, jwt, status }) => {
		const token = headers['authorization']?.slice(7);
		const payload = token ? await jwt.verify(token) : null;

		if (!payload || typeof payload !== 'object' || (payload as any).tipo !== 'tendero')
			return status(401, { error: 'Solo los tenderos pueden crear productos' });

		const usuario = payload as UsuarioJWT;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const [producto] = await conexion
			.insert(productos)
			.values({
				nombre: body.nombre,
				descripcion: body.descripcion,
				precio: body.precio,
				cantidad: body.cantidad,
				categoriaId: body.categoriaId,
				tenderoId: usuario.id,
			} as any)
			.returning();

		return status(201, producto);
	}, {
		body: t.Object({
			nombre: t.String(),
			descripcion: t.Optional(t.String()),
			precio: t.Number(),
			cantidad: t.Integer(),
			categoriaId: t.Optional(t.Integer()),
		}),
	});
