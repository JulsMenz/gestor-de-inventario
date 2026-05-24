<script lang="ts">
	import { page } from '$app/stores';
	import { getTienda, getCategorias } from '$lib/api/client';
	import { carrito } from '$lib/stores/carrito';
	import { authStore } from '$lib/stores/auth';
	import type { Producto, Categoria, Tienda } from '$lib/types';

	let tienda = $state<Tienda | null>(null);
	let productos = $state<Producto[]>([]);
	let categorias = $state<Categoria[]>([]);
	let buscar = $state('');
	let categoriaActiva = $state<number | null>(null);
	let cargando = $state(true);
	let error = $state('');
	let agregados = $state<Set<number>>(new Set());

	const slug = $derived($page.params.slug);

	$effect(() => {
		const s = slug;
		cargando = true;
		error = '';
		getTienda(s, { buscar: buscar || undefined, categoriaId: categoriaActiva || undefined })
			.then(({ tienda: t, productos: p }) => {
				tienda = t;
				productos = p;
			})
			.catch(() => (error = 'Tienda no encontrada o no disponible'))
			.finally(() => (cargando = false));
	});

	$effect(() => {
		if (!tienda) return;
		getCategorias({ tenderoId: tienda.id }).then((c) => (categorias = c)).catch(() => {});
	});

	// Recargar productos al cambiar filtros (sin cambiar tienda)
	$effect(() => {
		const b = buscar;
		const c = categoriaActiva;
		const s = slug;
		if (!tienda) return;
		getTienda(s, { buscar: b || undefined, categoriaId: c || undefined })
			.then(({ productos: p }) => (productos = p))
			.catch(() => {});
	});

	function formatPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency', currency: 'COP', maximumFractionDigits: 0
		}).format(precio);
	}

	function agregarAlCarrito(p: Producto) {
		carrito.agregar(p);
		agregados = new Set([...agregados, p.id]);
		setTimeout(() => {
			agregados = new Set([...agregados].filter((id) => id !== p.id));
		}, 1500);
	}

	const esTendero = $derived($authStore.usuario?.tipo === 'tendero');
</script>

{#if cargando && !tienda}
	<div class="flex justify-center py-20">
		<span class="loading loading-spinner loading-lg text-primary"></span>
	</div>
{:else if error}
	<div class="text-center py-20">
		<div class="text-6xl mb-4">🔍</div>
		<p class="text-xl text-base-content/50 mb-4">{error}</p>
		<a href="/" class="btn btn-primary">Ver todas las tiendas</a>
	</div>
{:else if tienda}
	<!-- Header de la tienda -->
	<div class="hero bg-primary text-primary-content rounded-2xl mb-8 py-10">
		<div class="hero-content text-center">
			<div>
				<div class="bg-primary-content text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold">{tienda.nombreTienda ?? tienda.nombre}</h1>
				<p class="opacity-70 mt-1">@{tienda.slugTienda}</p>
				<a href="/" class="btn btn-ghost btn-sm mt-3 opacity-80">← Ver todas las tiendas</a>
			</div>
		</div>
	</div>

	<!-- Búsqueda -->
	<div class="mb-6">
		<label class="input input-bordered flex items-center gap-2 max-w-md">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
			</svg>
			<input type="text" placeholder="Buscar en {tienda.nombreTienda ?? tienda.nombre}..." class="grow" bind:value={buscar} />
		</label>
	</div>

	<!-- Filtro por categoría -->
	{#if categorias.length > 0}
		<div class="flex flex-wrap gap-2 mb-6">
			<button class="btn btn-sm {categoriaActiva === null ? 'btn-primary' : 'btn-outline btn-primary'}"
				onclick={() => (categoriaActiva = null)}>Todos</button>
			{#each categorias as cat}
				<button
					class="btn btn-sm {categoriaActiva === cat.id ? 'btn-primary' : 'btn-outline btn-primary'}"
					onclick={() => (categoriaActiva = categoriaActiva === cat.id ? null : cat.id)}>
					{cat.nombre}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Productos -->
	{#if cargando}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each { length: 8 } as _}
				<div class="card bg-base-100 shadow">
					<div class="card-body gap-3">
						<div class="skeleton h-5 w-3/4 rounded"></div>
						<div class="skeleton h-4 w-full rounded"></div>
						<div class="skeleton h-8 w-1/2 rounded mt-2"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if productos.length === 0}
		<div class="text-center py-16">
			<div class="text-5xl mb-3">📭</div>
			<p class="text-xl text-base-content/50">No hay productos disponibles</p>
			{#if buscar || categoriaActiva}
				<button class="btn btn-ghost btn-sm mt-3"
					onclick={() => { buscar = ''; categoriaActiva = null; }}>Limpiar filtros</button>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-base-content/50 mb-4">
			{productos.length} producto{productos.length !== 1 ? 's' : ''}
		</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each productos as p}
				<div class="card bg-base-100 shadow hover:shadow-lg transition-shadow duration-200">
					<div class="card-body">
						<h2 class="card-title text-base leading-tight">{p.nombre}</h2>
						{#if p.descripcion}
							<p class="text-sm text-base-content/60 line-clamp-2">{p.descripcion}</p>
						{/if}
						<div class="mt-auto pt-3 border-t border-base-200">
							<p class="text-2xl font-bold text-primary">{formatPrecio(p.precio)}</p>
							<div class="flex flex-wrap gap-1 mt-2 mb-3">
								<span class="badge badge-sm {p.cantidad > 0 ? 'badge-success' : 'badge-error'}">
									{p.cantidad > 0 ? `${p.cantidad} en stock` : 'Agotado'}
								</span>
								{#if p.categoria}
									<span class="badge badge-sm badge-outline">{p.categoria}</span>
								{/if}
							</div>
							{#if !esTendero && p.cantidad > 0}
								<button
									class="btn btn-primary btn-sm w-full {agregados.has(p.id) ? 'btn-success' : ''}"
									onclick={() => agregarAlCarrito(p)}>
									{agregados.has(p.id) ? '¡Agregado!' : 'Agregar al carrito'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{/if}
