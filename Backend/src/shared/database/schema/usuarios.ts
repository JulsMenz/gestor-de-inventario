import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const usuarios = pgTable('usuarios', {
	id: serial('id').primaryKey(),
	nombre: text('nombre').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	tipo: text('tipo', { enum: ['tendero', 'cliente'] }).notNull(),
	nombreTienda: text('nombre_tienda'),
	slugTienda: text('slug_tienda').unique(),
	creadoEn: timestamp('creado_en').defaultNow().notNull(),
});
