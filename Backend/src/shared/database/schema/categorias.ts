import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios';

export const categorias = pgTable('categorias', {
	id: serial('id').primaryKey(),
	nombre: text('nombre').notNull(),
	descripcion: text('descripcion'),
	tenderoId: integer('tendero_id').references(() => usuarios.id),
	creadoEn: timestamp('creado_en').defaultNow().notNull(),
});
