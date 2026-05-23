import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from 'drizzle-orm/pg-core';
import { categorias } from './categorias';
import { usuarios } from './usuarios';

export const productos = pgTable('productos', {
	id: serial('id').primaryKey(),
	nombre: text('nombre').notNull(),
	descripcion: text('descripcion'),
	precio: doublePrecision('precio').notNull(),
	cantidad: integer('cantidad').notNull().default(0),
	categoriaId: integer('categoria_id').references(() => categorias.id),
	tenderoId: integer('tendero_id').references(() => usuarios.id),
	activo: boolean('activo').notNull().default(true),
	creadoEn: timestamp('creado_en').defaultNow().notNull(),
	actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
});
