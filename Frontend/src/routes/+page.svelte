<script lang="ts">
	import { getTiendas } from '$lib/api/client';
	import type { Tienda } from '$lib/types';

	let tiendas = $state<Tienda[]>([]);
	let cargando = $state(true);
	let error = $state('');

	$effect(() => {
		getTiendas()
			.then((t) => (tiendas = t))
			.catch(() => (error = 'No se pudieron cargar las tiendas'))
			.finally(() => (cargando = false));
	});
</script>

<div>
	<!-- Hero -->
	<div class="hero bg-primary text-primary-content rounded-2xl mb-10 py-14">
		<div class="hero-content text-center">
			<div>
				<h1 class="text-4xl font-bold mb-2">Tiendas de barrio</h1>
				<p class="text-lg opacity-80">Apoya a los comerciantes locales de tu comunidad</p>
			</div>
		</div>
	</div>

	{#if error}
		<div class="alert alert-error mb-6"><span>{error}</span></div>
	{/if}

	{#if cargando}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each { length: 6 } as _}
				<div class="card bg-base-100 shadow">
					<div class="card-body gap-3">
						<div class="skeleton h-6 w-2/3 rounded"></div>
						<div class="skeleton h-4 w-1/3 rounded"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if tiendas.length === 0}
		<div class="text-center py-20">
			<div class="text-6xl mb-4">🏪</div>
			<p class="text-xl text-base-content/50">Aún no hay tiendas registradas</p>
			<p class="text-sm text-base-content/40 mt-2">
				¿Eres tendero? <a href="/registro" class="link link-primary">Crea tu tienda</a>
			</p>
		</div>
	{:else}
		<h2 class="text-xl font-semibold mb-4">
			{tiendas.length} tienda{tiendas.length !== 1 ? 's' : ''} disponible{tiendas.length !== 1 ? 's' : ''}
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each tiendas as tienda}
				<a href="/{tienda.slugTienda}" class="card bg-base-100 shadow hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer">
					<div class="card-body">
						<div class="flex items-center gap-3">
							<div class="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
								</svg>
							</div>
							<div>
								<h2 class="card-title text-lg leading-tight">
									{tienda.nombreTienda ?? tienda.nombre}
								</h2>
								<p class="text-sm text-base-content/50">@{tienda.slugTienda}</p>
							</div>
						</div>
						<div class="card-actions justify-end mt-2">
							<span class="btn btn-primary btn-sm">Ver productos →</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
