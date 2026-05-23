import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, usuarios } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

export const login = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.post('/login', async ({ body, jwt, status }) => {
		const [usuario] = await conexion
			.select()
			.from(usuarios)
			.where(eq(usuarios.email, body.email));

		if (!usuario) return status(401, { error: 'Email o contraseña incorrectos' });

		const valida = await Bun.password.verify(body.password, usuario.password);
		if (!valida) return status(401, { error: 'Email o contraseña incorrectos' });

		const token = await jwt.sign({
			id: usuario.id,
			nombre: usuario.nombre,
			email: usuario.email,
			tipo: usuario.tipo,
		});

		return {
			token,
			usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, tipo: usuario.tipo },
		};
	}, {
		body: t.Object({
			email: t.String(),
			password: t.String(),
		}),
	});
