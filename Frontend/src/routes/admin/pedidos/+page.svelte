<script lang="ts">
	import { getPedidos, actualizarEstadoPedido } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { Pedido, EstadoPedido } from '$lib/types';

	let pedidos = $state<Pedido[]>([]);
	let cargando = $state(true);
	let toastMsg = $state('');
	let toastTipo = $state<'success' | 'error'>('success');
	let toastVisible = $state(false);
	let pedidoAbierto = $state<number | null>(null);

	$effect(() => {
		// Redirigir si no es tendero
		if ($authStore.usuario && $authStore.usuario.tipo !== 'tendero') goto('/');
		else if (!$authStore.usuario) goto('/login');
		else cargar();
	});

	async function cargar() {
		cargando = true;
		try {
			pedidos = await getPedidos();
		} catch (e: any) {
			mostrarToast(e.message ?? 'Error al cargar pedidos', 'error');
		} finally {
			cargando = false;
		}
	}

	async function cambiarEstado(id: number, estado: EstadoPedido) {
		try {
			await actualizarEstadoPedido(id, estado);
			pedidos = pedidos.map((p) => (p.id === id ? { ...p, estado } : p));
			mostrarToast('Estado actualizado');
		} catch (e: any) {
			mostrarToast(e.message ?? 'Error al actualizar', 'error');
		}
	}

	function mostrarToast(msg: string, tipo: 'success' | 'error' = 'success') {
		toastMsg = msg;
		toastTipo = tipo;
		toastVisible = true;
		setTimeout(() => (toastVisible = false), 3000);
	}

	function formatPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency', currency: 'COP', maximumFractionDigits: 0
		}).format(precio);
	}

	function formatFecha(fecha: string) {
		return new Date(fecha).toLocaleString('es-CO', {
			day: '2-digit', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	const estadoConfig: Record<EstadoPedido, { color: string; label: string }> = {
		pendiente:  { color: 'badge-warning',  label: 'Pendiente' },
		confirmado: { color: 'badge-info',     label: 'Confirmado' },
		entregado:  { color: 'badge-success',  label: 'Entregado' },
		cancelado:  { color: 'badge-error',    label: 'Cancelado' },
	};

	const estadosSiguientes: Record<EstadoPedido, EstadoPedido[]> = {
		pendiente:  ['confirmado', 'cancelado'],
		confirmado: ['entregado', 'cancelado'],
		entregado:  [],
		cancelado:  [],
	};
</script>

{#if toastVisible}
	<div class="toast toast-top toast-end z-100">
		<div class="alert {toastTipo === 'success' ? 'alert-success' : 'alert-error'} shadow-lg">
			<span>{toastMsg}</span>
		</div>
	</div>
{/if}

<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
	<div>
		<h1 class="text-2xl font-bold">Pedidos recibidos</h1>
		<p class="text-sm text-base-content/60">Gestiona los pedidos de tus clientes</p>
	</div>
	<button class="btn btn-ghost btn-sm" onclick={cargar}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
		</svg>
		Actualizar
	</button>
</div>

{#if cargando}
	<div class="flex justify-center py-16">
		<span class="loading loading-spinner loading-lg text-primary"></span>
	</div>
{:else if pedidos.length === 0}
	<div class="text-center py-20 text-base-content/50">
		<div class="text-6xl mb-4">📋</div>
		<p class="text-xl">No hay pedidos aún</p>
		<p class="text-sm mt-2">Los pedidos de tus clientes aparecerán aquí</p>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#each pedidos as p}
			<div class="card bg-base-100 shadow">
				<div class="card-body py-4">
					<!-- Encabezado del pedido -->
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								<span class="font-bold text-lg">Pedido #{p.id}</span>
								<span class="badge {estadoConfig[p.estado].color}">{estadoConfig[p.estado].label}</span>
								{#if !p.clienteId}
									<span class="badge badge-outline badge-sm">Invitado</span>
								{/if}
							</div>
							<p class="text-sm text-base-content/60 mt-1">
								{p.nombreContacto}
								{#if p.telefonoContacto}
									· {p.telefonoContacto}
								{/if}
							</p>
							<p class="text-xs text-base-content/40">{formatFecha(p.creadoEn)}</p>
						</div>
						<div class="text-right">
							<p class="text-xl font-bold text-primary">{formatPrecio(p.total)}</p>
						</div>
					</div>

					<!-- Items del pedido (colapsable) -->
					{#if p.items && p.items.length > 0}
						<div class="mt-3">
							<button
								class="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1"
								onclick={() => pedidoAbierto = pedidoAbierto === p.id ? null : p.id}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform {pedidoAbierto === p.id ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
								{p.items.length} producto{p.items.length !== 1 ? 's' : ''}
							</button>

							{#if pedidoAbierto === p.id}
								<div class="mt-2 flex flex-col gap-1">
									{#each p.items as item}
										<div class="flex justify-between text-sm py-1 border-b border-base-200 last:border-0">
											<span>{item.nombreProducto ?? 'Producto'} × {item.cantidad}</span>
											<span class="font-medium">{formatPrecio(item.subtotal)}</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Acciones de estado -->
					{#if estadosSiguientes[p.estado].length > 0}
						<div class="flex gap-2 mt-3 pt-3 border-t border-base-200">
							<span class="text-sm text-base-content/60 self-center">Cambiar a:</span>
							{#each estadosSiguientes[p.estado] as sig}
								<button
									class="btn btn-sm {sig === 'cancelado' ? 'btn-error btn-outline' : 'btn-primary'}"
									onclick={() => cambiarEstado(p.id, sig)}
								>
									{estadoConfig[sig].label}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
