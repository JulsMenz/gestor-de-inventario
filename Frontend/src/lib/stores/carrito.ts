import { writable, derived } from 'svelte/store';
import type { Producto } from '$lib/types';

export interface ItemCarrito {
	producto: Producto;
	cantidad: number;
}

const { subscribe, update, set } = writable<ItemCarrito[]>([]);

export const carrito = {
	subscribe,
	agregar(producto: Producto, cantidad = 1) {
		update((items) => {
			const existente = items.find((i) => i.producto.id === producto.id);
			if (existente) {
				return items.map((i) =>
					i.producto.id === producto.id
						? { ...i, cantidad: Math.min(i.cantidad + cantidad, producto.cantidad) }
						: i
				);
			}
			return [...items, { producto, cantidad: Math.min(cantidad, producto.cantidad) }];
		});
	},
	quitar(productoId: number) {
		update((items) => items.filter((i) => i.producto.id !== productoId));
	},
	cambiarCantidad(productoId: number, cantidad: number) {
		update((items) =>
			cantidad <= 0
				? items.filter((i) => i.producto.id !== productoId)
				: items.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i))
		);
	},
	limpiar() {
		set([]);
	},
};

export const totalItems = derived({ subscribe }, ($items) =>
	$items.reduce((s, i) => s + i.cantidad, 0)
);

export const totalPrecio = derived({ subscribe }, ($items) =>
	$items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)
);
