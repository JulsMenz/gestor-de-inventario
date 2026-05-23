import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { eq } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, usuarios } = database;
const JWT_SECRET = process.env.JWT_SECRET ?? 'inventario-barrio-secret-2024';

function generarSlug(texto: string): string {
	return texto
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

export const registro = new Elysia()
	.use(jwt({ name: 'jwt', secret: JWT_SECRET }))
	.post('/registro', async ({ body, jwt, status }) => {
		const [existente] = await conexion
			.select({ id: usuarios.id })
			.from(usuarios)
			.where(eq(usuarios.email, body.email));

		if (existente) return status(409, { error: 'El email ya está registrado' });

		// Generar slug único para tenderos
		let slugTienda: string | null = null;
		if (body.tipo === 'tendero') {
			if (!body.nombreTienda?.trim())
				return status(400, { error: 'Los tenderos deben indicar el nombre de su tienda' });

			slugTienda = generarSlug(body.nombreTienda);
			const [slugExistente] = await conexion
				.select({ id: usuarios.id })
				.from(usuarios)
				.where(eq(usuarios.slugTienda, slugTienda));

			if (slugExistente) slugTienda = `${slugTienda}-${Date.now()}`;
		}

		const passwordHash = await Bun.password.hash(body.password);

		const [usuario] = await conexion
			.insert(usuarios)
			.values({
				nombre: body.nombre,
				email: body.email,
				password: passwordHash,
				tipo: body.tipo,
				nombreTienda: body.nombreTienda?.trim() ?? null,
				slugTienda,
			})
			.returning({
				id: usuarios.id,
				nombre: usuarios.nombre,
				email: usuarios.email,
				tipo: usuarios.tipo,
				nombreTienda: usuarios.nombreTienda,
				slugTienda: usuarios.slugTienda,
			});

		const token = await jwt.sign({
			id: usuario.id,
			nombre: usuario.nombre,
			email: usuario.email,
			tipo: usuario.tipo,
		});

		return status(201, { token, usuario });
	}, {
		body: t.Object({
			nombre: t.String({ minLength: 2 }),
			email: t.String({ minLength: 5 }),
			password: t.String({ minLength: 6 }),
			tipo: t.Union([t.Literal('tendero'), t.Literal('cliente')]),
			nombreTienda: t.Optional(t.String()),
		}),
	});
