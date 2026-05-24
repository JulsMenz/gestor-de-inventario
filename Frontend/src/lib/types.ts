export interface Categoria {
	id: number;
	nombre: string;
	descripcion: string | null;
	tenderoId: number | null;
	creadoEn: string;
}

export interface Producto {
	id: number;
	nombre: string;
	descripcion: string | null;
	precio: number;
	cantidad: number;
	categoriaId: number | null;
	categoria: string | null;
	tenderoId: number | null;
}

export type TipoUsuario = 'tendero' | 'cliente';

export interface Usuario {
	id: number;
	nombre: string;
	email: string;
	tipo: TipoUsuario;
	nombreTienda?: string | null;
	slugTienda?: string | null;
}

export interface Tienda {
	id: number;
	nombre: string;
	nombreTienda: string | null;
	slugTienda: string | null;
}

export type EstadoPedido = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';

export interface DetallePedido {
	id: number;
	productoId: number;
	nombreProducto: string | null;
	cantidad: number;
	precioUnitario: number;
	subtotal: number;
}

export interface Pedido {
	id: number;
	clienteId: number | null;
	tenderoId: number | null;
	nombreContacto: string;
	telefonoContacto: string | null;
	estado: EstadoPedido;
	total: number;
	creadoEn: string;
	actualizadoEn: string;
	items?: DetallePedido[];
}
