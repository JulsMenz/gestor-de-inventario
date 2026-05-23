import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { database } from '../../../shared';

const { categorias, conexion } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

type UsuarioJWT = { id: number; nombre: string; tipo: string };

export const crear = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.post('/', async ({ body, headers, jwt, status }) => {
		const token = headers['authorization']?.slice(7);
		const payload = token ? await jwt.verify(token) : null;
		const usuario = (payload && typeof payload === 'object') ? payload as UsuarioJWT : null;

		if (!usuario || usuario.tipo !== 'tendero') return status(401, { error: 'No autorizado' });

		const [categoria] = await conexion
			.insert(categorias)
			.values({ nombre: body.nombre, descripcion: body.descripcion, tenderoId: usuario.id } as any)
			.returning();

		return status(201, categoria);
	}, {
		body: t.Object({
			nombre: t.String(),
			descripcion: t.Optional(t.String()),
		}),
	});
