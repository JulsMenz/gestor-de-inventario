import type { Categoria, Producto, Pedido, Tienda, Usuario, EstadoPedido } from '$lib/types';

// const BASE_URL = 'http://localhost:8000';
const BASE_URL = '/api';

function getToken(): string | null
{
	if (typeof localStorage === 'undefined') return null;
	try
	{
		const stored = localStorage.getItem('auth');
		return stored ? JSON.parse(stored).token : null;
	} catch
	{
		return null;
	}
}

async function req<T>(path: string, options?: RequestInit, auth = false): Promise<T>
{
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (auth)
	{
		const token = getToken();
		if (token) headers['Authorization'] = `Bearer ${token}`;
	}
	const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });
	if (res.status === 204) return undefined as T;
	if (!res.ok)
	{
		const body = await res.json().catch(() => ({ error: `Error ${res.status}` }));
		throw new Error(body.error ?? `Error ${res.status}`);
	}
	return res.json();
}

// ── Categorías ──────────────────────────────────────────────────────────────
export const getCategorias = (params?: { tenderoId?: number; }) =>
{
	const q = new URLSearchParams();
	if (params?.tenderoId) q.set('tenderoId', String(params.tenderoId));
	const qs = q.toString();
	return req<Categoria[]>(`/categorias/${qs ? `?${qs}` : ''}`);
};
export const createCategoria = (data: { nombre: string; descripcion?: string; }) =>
	req<Categoria>('/categorias/', { method: 'POST', body: JSON.stringify(data) }, true);
export const updateCategoria = (id: number, data: { nombre?: string; descripcion?: string; }) =>
	req<Categoria>(`/categorias/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, true);
export const deleteCategoria = (id: number) =>
	req<void>(`/categorias/${id}`, { method: 'DELETE' }, true);

// ── Productos ────────────────────────────────────────────────────────────────
export const getProductos = (params?: { categoriaId?: number; buscar?: string; tenderoId?: number; }) =>
{
	const q = new URLSearchParams();
	if (params?.categoriaId) q.set('categoriaId', String(params.categoriaId));
	if (params?.buscar) q.set('buscar', params.buscar);
	if (params?.tenderoId) q.set('tenderoId', String(params.tenderoId));
	const qs = q.toString();
	return req<Producto[]>(`/productos/${qs ? `?${qs}` : ''}`);
};
export const createProducto = (data: {
	nombre: string; descripcion?: string;
	precio: number; cantidad: number; categoriaId?: number;
}) => req<Producto>('/productos/', { method: 'POST', body: JSON.stringify(data) }, true);
export const updateProducto = (id: number, data: Partial<{
	nombre: string; descripcion: string;
	precio: number; cantidad: number; categoriaId: number | null;
}>) => req<Producto>(`/productos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, true);
export const deleteProducto = (id: number) =>
	req<void>(`/productos/${id}`, { method: 'DELETE' }, true);

// ── Tiendas ──────────────────────────────────────────────────────────────────
export const getTiendas = () => req<Tienda[]>('/tiendas/');
export const getTienda = (slug: string, params?: { buscar?: string; categoriaId?: number; }) =>
{
	const q = new URLSearchParams();
	if (params?.buscar) q.set('buscar', params.buscar);
	if (params?.categoriaId) q.set('categoriaId', String(params.categoriaId));
	const qs = q.toString();
	return req<{ tienda: Tienda; productos: Producto[]; }>(`/tiendas/${slug}${qs ? `?${qs}` : ''}`);
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registrarse = (data: {
	nombre: string; email: string; password: string;
	tipo: 'tendero' | 'cliente'; nombreTienda?: string;
}) => req<{ token: string; usuario: Usuario; }>('/auth/registro', { method: 'POST', body: JSON.stringify(data) });

export const iniciarSesion = (data: { email: string; password: string; }) =>
	req<{ token: string; usuario: Usuario; }>('/auth/login', { method: 'POST', body: JSON.stringify(data) });

// ── Pedidos ──────────────────────────────────────────────────────────────────
export const crearPedido = (data: {
	nombreContacto?: string;
	telefonoContacto?: string;
	items: { productoId: number; cantidad: number; }[];
}) => req<Pedido[]>('/pedidos/', { method: 'POST', body: JSON.stringify(data) }, true);

export const getPedidos = () => req<Pedido[]>('/pedidos/', {}, true);

export const actualizarEstadoPedido = (id: number, estado: EstadoPedido) =>
	req<Pedido>(`/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }, true);
