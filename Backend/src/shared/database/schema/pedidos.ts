import { pgTable, serial, text, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios';

export const pedidos = pgTable('pedidos', {
	id: serial('id').primaryKey(),
	clienteId: integer('cliente_id').references(() => usuarios.id),
	tenderoId: integer('tendero_id').references(() => usuarios.id),
	nombreContacto: text('nombre_contacto').notNull(),
	telefonoContacto: text('telefono_contacto'),
	estado: text('estado', { enum: ['pendiente', 'confirmado', 'entregado', 'cancelado'] })
		.notNull()
		.default('pendiente'),
	total: doublePrecision('total').notNull(),
	creadoEn: timestamp('creado_en').defaultNow().notNull(),
	actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
});
