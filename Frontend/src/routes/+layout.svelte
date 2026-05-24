<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { carrito, totalItems, totalPrecio } from '$lib/stores/carrito';

	let { children } = $props();

	function formatPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency', currency: 'COP', maximumFractionDigits: 0
		}).format(precio);
	}

	function logout() {
		authStore.logout();
		goto('/');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="drawer drawer-end">
	<input id="carrito-drawer" type="checkbox" class="drawer-toggle" />

	<div class="drawer-content flex flex-col min-h-screen bg-base-200">
		<!-- Navbar -->
		<div class="navbar bg-base-100 shadow-sm sticky top-0 z-40">
			<div class="navbar-start">
				<div class="dropdown">
					<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
						</svg>
					</div>
					<ul tabindex="0" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg">
						<li><a href="/">Catálogo</a></li>
						{#if $authStore.usuario?.tipo === 'tendero'}
							<li class="menu-title">Administrar</li>
							<li><a href="/admin/productos">Productos</a></li>
							<li><a href="/admin/categorias">Categorías</a></li>
							<li><a href="/admin/pedidos">Pedidos</a></li>
						{/if}
					</ul>
				</div>
				<a href="/" class="btn btn-ghost text-xl font-bold text-primary">Mi Tienda</a>
			</div>

			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal px-1 gap-1">
					<li><a href="/" class="font-medium">Catálogo</a></li>
					{#if $authStore.usuario?.tipo === 'tendero'}
						<li>
							<details>
								<summary class="font-medium">Administrar</summary>
								<ul class="p-2 z-50 w-48 shadow-lg bg-base-100 rounded-box">
									<li><a href="/admin/productos">Productos</a></li>
									<li><a href="/admin/categorias">Categorías</a></li>
									<li><a href="/admin/pedidos">Pedidos</a></li>
								</ul>
							</details>
						</li>
					{/if}
				</ul>
			</div>

			<div class="navbar-end gap-2">
				{#if $authStore.usuario?.tipo !== 'tendero'}
					<!-- Botón carrito -->
					<label for="carrito-drawer" class="btn btn-ghost btn-square relative drawer-button">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						{#if $totalItems > 0}
							<span class="badge badge-primary badge-xs absolute -top-1 -right-1">{$totalItems}</span>
						{/if}
					</label>
				{/if}

				{#if $authStore.usuario}
					<div class="dropdown dropdown-end">
						<div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
							<span class="hidden sm:inline text-sm font-medium max-w-24 truncate">{$authStore.usuario.nombre}</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
						<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow-lg mt-1">
							<li class="menu-title text-xs opacity-60">{$authStore.usuario.tipo === 'tendero' ? 'Tendero' : 'Cliente'}</li>
							<li><button onclick={logout} class="text-error">Cerrar sesión</button></li>
						</ul>
					</div>
				{:else}
					<a href="/login" class="btn btn-primary btn-sm">Ingresar</a>
				{/if}
			</div>
		</div>

		<!-- Contenido principal -->
		<main class="container mx-auto px-4 py-8 max-w-7xl flex-1">
			{@render children()}
		</main>
	</div>

	<!-- Drawer del carrito -->
	<div class="drawer-side z-50">
		<label for="carrito-drawer" aria-label="cerrar carrito" class="drawer-overlay"></label>
		<div class="bg-base-100 w-80 min-h-screen flex flex-col shadow-xl">
			<div class="p-4 border-b border-base-200 flex items-center justify-between">
				<h2 class="text-lg font-bold">Tu carrito</h2>
				<label for="carrito-drawer" class="btn btn-sm btn-ghost btn-square">✕</label>
			</div>

			{#if $carrito.length === 0}
				<div class="flex-1 flex flex-col items-center justify-center p-8 text-base-content/40">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<p>Tu carrito está vacío</p>
				</div>
			{:else}
				<div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
					{#each $carrito as item}
						<div class="flex items-center gap-3 bg-base-200 rounded-xl p-3">
							<div class="flex-1 min-w-0">
								<p class="font-medium text-sm truncate">{item.producto.nombre}</p>
								<p class="text-xs text-base-content/60">{formatPrecio(item.producto.precio)} c/u</p>
							</div>
							<div class="flex items-center gap-1">
								<button
									class="btn btn-xs btn-ghost btn-square"
									onclick={() => carrito.cambiarCantidad(item.producto.id, item.cantidad - 1)}
								>−</button>
								<span class="w-6 text-center text-sm font-medium">{item.cantidad}</span>
								<button
									class="btn btn-xs btn-ghost btn-square"
									disabled={item.cantidad >= item.producto.cantidad}
									onclick={() => carrito.cambiarCantidad(item.producto.id, item.cantidad + 1)}
								>+</button>
							</div>
							<button
								class="btn btn-xs btn-ghost btn-square text-error"
								onclick={() => carrito.quitar(item.producto.id)}
							>✕</button>
						</div>
					{/each}
				</div>

				<div class="p-4 border-t border-base-200 flex flex-col gap-3">
					<div class="flex justify-between items-center font-bold text-lg">
						<span>Total</span>
						<span class="text-primary">{formatPrecio($totalPrecio)}</span>
					</div>
					<label for="carrito-drawer" class="w-full">
						<a href="/checkout" class="btn btn-primary w-full">Realizar pedido</a>
					</label>
				</div>
			{/if}
		</div>
	</div>
</div>
