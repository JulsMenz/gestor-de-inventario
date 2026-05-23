import { pgTable, serial, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { pedidos } from './pedidos';
import { productos } from './productos';

export const detallePedido = pgTable('detalle_pedido', {
	id: serial('id').primaryKey(),
	pedidoId: integer('pedido_id').references(() => pedidos.id).notNull(),
	productoId: integer('producto_id').references(() => productos.id).notNull(),
	cantidad: integer('cantidad').notNull(),
	precioUnitario: doublePrecision('precio_unitario').notNull(),
	subtotal: doublePrecision('subtotal').notNull(),
});
