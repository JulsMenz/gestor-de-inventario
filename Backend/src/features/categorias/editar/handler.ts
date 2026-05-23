import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { categorias, conexion } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

type UsuarioJWT = { id: number; nombre: string; tipo: string };

export const editar = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.patch('/:id', async ({ params, body, headers, jwt, status }) => {
		const token = headers['authorization']?.slice(7);
		const payload = token ? await jwt.verify(token) : null;
		const usuario = (payload && typeof payload === 'object') ? payload as UsuarioJWT : null;

		if (!usuario || usuario.tipo !== 'tendero') return status(401, { error: 'No autorizado' });

		const [existente] = await conexion.select().from(categorias).where(eq(categorias.id, params.id));
		if (!existente) return status(404, { error: 'Categoría no encontrada' });
		if ((existente as any).tenderoId !== usuario.id) return status(403, { error: 'No tienes permiso para editar esta categoría' });

		const [categoria] = await conexion
			.update(categorias)
			.set(body)
			.where(eq(categorias.id, params.id))
			.returning();

		return status(200, categoria);
	}, {
		params: t.Object({ id: t.Numeric() }),
		body: t.Object({
			nombre: t.Optional(t.String()),
			descripcion: t.Optional(t.String()),
		}),
	});
