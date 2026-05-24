<script lang="ts">
	import { carrito, totalPrecio } from '$lib/stores/carrito';
	import { authStore } from '$lib/stores/auth';
	import { crearPedido } from '$lib/api/client';
	import { goto } from '$app/navigation';

	let nombre = $state($authStore.usuario?.nombre ?? '');
	let telefono = $state('');
	let cargando = $state(false);
	let error = $state('');

	function formatPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency', currency: 'COP', maximumFractionDigits: 0
		}).format(precio);
	}

	// Agrupar items por tienda para mostrar el resumen
	const itemsPorTienda = $derived(() => {
		const mapa = new Map<number | null, typeof $carrito>();
		for (const item of $carrito) {
			const tid = item.producto.tenderoId;
			if (!mapa.has(tid)) mapa.set(tid, []);
			mapa.get(tid)!.push(item);
		}
		return mapa;
	});

	async function confirmarPedido(e: SubmitEvent) {
		e.preventDefault();
		if ($carrito.length === 0) return;

		const contacto = nombre.trim() || ($authStore.usuario?.nombre ?? '');
		if (!contacto) { error = 'Por favor ingresa tu nombre'; return; }

		cargando = true;
		error = '';
		try {
			await crearPedido({
				nombreContacto: contacto,
				telefonoContacto: telefono.trim() || undefined,
				items: $carrito.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
			});
			carrito.limpiar();
			goto('/pedido-confirmado');
		} catch (err: any) {
			error = err.message ?? 'Error al procesar el pedido';
		} finally {
			cargando = false;
		}
	}
</script>

{#if $carrito.length === 0}
	<div class="text-center py-20">
		<div class="text-6xl mb-4">🛒</div>
		<p class="text-xl text-base-content/50 mb-4">Tu carrito está vacío</p>
		<a href="/" class="btn btn-primary">Ver tiendas</a>
	</div>
{:else}
	<div class="max-w-2xl mx-auto">
		<h1 class="text-2xl font-bold mb-6">Confirmar pedido</h1>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Resumen agrupado por tienda -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title text-lg">Resumen</h2>

					{#each [...itemsPorTienda()] as [_tid, items]}
						<div class="mb-3">
							{#if items[0].producto.tenderoId !== null}
								<p class="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
									Tienda #{items[0].producto.tenderoId}
								</p>
							{/if}
							{#each items as item}
								<div class="flex justify-between items-center text-sm py-1 border-b border-base-200 last:border-0">
									<div>
										<p class="font-medium">{item.producto.nombre}</p>
										<p class="text-base-content/60">x{item.cantidad} × {formatPrecio(item.producto.precio)}</p>
									</div>
									<span class="font-semibold">{formatPrecio(item.producto.precio * item.cantidad)}</span>
								</div>
							{/each}
						</div>
					{/each}

					<div class="flex justify-between items-center font-bold text-lg pt-2 border-t border-base-200 mt-1">
						<span>Total</span>
						<span class="text-primary">{formatPrecio($totalPrecio)}</span>
					</div>

					{#if itemsPorTienda().size > 1}
						<div class="alert alert-info py-2 text-sm mt-2">
							<span>Se crearán {itemsPorTienda().size} pedidos separados, uno por tienda.</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Datos de contacto -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title text-lg">
						{$authStore.usuario ? 'Confirmar datos' : 'Datos de contacto'}
					</h2>
					{#if !$authStore.usuario}
						<p class="text-sm text-base-content/60 mb-2">
							Pedido como <span class="font-medium text-primary">invitado</span>.
							<a href="/login" class="link">Inicia sesión</a> para mayor seguimiento.
						</p>
					{/if}

					{#if error}
						<div class="alert alert-error py-2 text-sm mb-2"><span>{error}</span></div>
					{/if}

					<form onsubmit={confirmarPedido} class="flex flex-col gap-4">
						<label class="form-control">
							<div class="label"><span class="label-text">Nombre *</span></div>
							<input type="text" class="input input-bordered" placeholder="Tu nombre"
								bind:value={nombre} required />
						</label>
						<label class="form-control">
							<div class="label"><span class="label-text">Teléfono (opcional)</span></div>
							<input type="tel" class="input input-bordered" placeholder="300 000 0000"
								bind:value={telefono} />
						</label>
						<button type="submit" class="btn btn-primary" disabled={cargando}>
							{#if cargando}
								<span class="loading loading-spinner loading-sm"></span>
							{/if}
							Confirmar pedido
						</button>
						<a href="/" class="btn btn-ghost btn-sm text-center">Seguir comprando</a>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
