import { Elysia } from 'elysia';
import { eq, isNotNull } from 'drizzle-orm';
import { database } from '../../../shared';

const { conexion, usuarios } = database;

export const listar = new Elysia()
	.get('/', async () => {
		return conexion
			.select({
				id: usuarios.id,
				nombre: usuarios.nombre,
				nombreTienda: usuarios.nombreTienda,
				slugTienda: usuarios.slugTienda,
			})
			.from(usuarios)
			.where(eq(usuarios.tipo, 'tendero') && isNotNull(usuarios.slugTienda));
	});
