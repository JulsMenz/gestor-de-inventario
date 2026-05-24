<script lang="ts">
	import {
		getProductos,
		getCategorias,
		createProducto,
		updateProducto,
		deleteProducto
	} from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import type { Producto, Categoria } from '$lib/types';

	let productos = $state<Producto[]>([]);
	let categorias = $state<Categoria[]>([]);
	let buscar = $state('');
	let categoriaFiltro = $state<number | null>(null);
	let cargando = $state(true);
	let guardando = $state(false);

	// Modal estado
	let productoEditando = $state<Producto | null>(null);
	let productoEliminar = $state<Producto | null>(null);

	// Formulario
	let fNombre = $state('');
	let fDescripcion = $state('');
	let fPrecio = $state(0);
	let fCantidad = $state(0);
	let fCategoriaId = $state('');

	// Toast
	let toastMsg = $state('');
	let toastTipo = $state<'success' | 'error'>('success');
	let toastVisible = $state(false);

	function mostrarToast(msg: string, tipo: 'success' | 'error' = 'success') {
		toastMsg = msg;
		toastTipo = tipo;
		toastVisible = true;
		setTimeout(() => (toastVisible = false), 3000);
	}

	$effect(() => {
		const tid = $authStore.usuario?.id;
		getCategorias({ tenderoId: tid }).then((c) => (categorias = c)).catch(() => {});
	});

	$effect(() => {
		const b = buscar;
		const c = categoriaFiltro;
		const tid = $authStore.usuario?.id;
		cargando = true;
		getProductos({ buscar: b || undefined, categoriaId: c || undefined, tenderoId: tid })
			.then((p) => (productos = p))
			.catch(() => mostrarToast('Error al cargar productos', 'error'))
			.finally(() => (cargando = false));
	});

	async function recargar() {
		productos = await getProductos({
			buscar: buscar || undefined,
			categoriaId: categoriaFiltro || undefined,
			tenderoId: $authStore.usuario?.id,
		});
	}

	function abrirModal(p?: Producto) {
		productoEditando = p ?? null;
		fNombre = p?.nombre ?? '';
		fDescripcion = p?.descripcion ?? '';
		fPrecio = p?.precio ?? 0;
		fCantidad = p?.cantidad ?? 0;
		fCategoriaId = p?.categoriaId ? String(p.categoriaId) : '';
		(document.getElementById('modal-producto') as HTMLDialogElement)?.showModal();
	}

	function abrirEliminar(p: Producto) {
		productoEliminar = p;
		(document.getElementById('modal-eliminar') as HTMLDialogElement)?.showModal();
	}

	async function guardar() {
		if (!fNombre.trim()) return;
		guardando = true;
		try {
			const data = {
				nombre: fNombre.trim(),
				descripcion: fDescripcion.trim() || undefined,
				precio: Number(fPrecio),
				cantidad: Number(fCantidad),
				categoriaId: fCategoriaId ? Number(fCategoriaId) : undefined
			};
			if (productoEditando) {
				await updateProducto(productoEditando.id, data);
				mostrarToast('Producto actualizado correctamente');
			} else {
				await createProducto(data);
				mostrarToast('Producto creado correctamente');
			}
			(document.getElementById('modal-producto') as HTMLDialogElement)?.close();
			await recargar();
		} catch {
			mostrarToast('Error al guardar el producto', 'error');
		} finally {
			guardando = false;
		}
	}

	async function confirmarEliminar() {
		if (!productoEliminar) return;
		guardando = true;
		try {
			await deleteProducto(productoEliminar.id);
			mostrarToast('Producto eliminado');
			(document.getElementById('modal-eliminar') as HTMLDialogElement)?.close();
			await recargar();
		} catch {
			mostrarToast('Error al eliminar el producto', 'error');
		} finally {
			guardando = false;
		}
	}

	function formatPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			maximumFractionDigits: 0
		}).format(precio);
	}
</script>

<!-- Toast -->
{#if toastVisible}
	<div class="toast toast-top toast-end z-100">
		<div class="alert {toastTipo === 'success' ? 'alert-success' : 'alert-error'} shadow-lg">
			<span>{toastMsg}</span>
		</div>
	</div>
{/if}

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
	<div>
		<h1 class="text-2xl font-bold">Gestión de Productos</h1>
		<p class="text-sm text-base-content/60">Administra el inventario de tu tienda</p>
	</div>
	<button class="btn btn-primary" onclick={() => abrirModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		Nuevo Producto
	</button>
</div>

<!-- Filtros -->
<div class="flex flex-col sm:flex-row gap-3 mb-6">
	<label class="input input-bordered flex items-center gap-2 flex-1">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
		</svg>
		<input type="text" placeholder="Buscar por nombre..." class="grow" bind:value={buscar} />
	</label>
	<select class="select select-bordered w-full sm:w-56" bind:value={categoriaFiltro}>
		<option value={null}>Todas las categorías</option>
		{#each categorias as cat}
			<option value={cat.id}>{cat.nombre}</option>
		{/each}
	</select>
</div>

<!-- Tabla -->
<div class="card bg-base-100 shadow overflow-hidden">
	{#if cargando}
		<div class="p-8 text-center">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if productos.length === 0}
		<div class="p-12 text-center text-base-content/50">
			<p class="text-4xl mb-3">📦</p>
			<p class="text-lg">No hay productos registrados</p>
			<button class="btn btn-primary btn-sm mt-4" onclick={() => abrirModal()}>Agregar el primero</button>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th>Nombre</th>
						<th>Categoría</th>
						<th class="text-right">Precio</th>
						<th class="text-center">Stock</th>
						<th class="text-center">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each productos as p}
						<tr class="hover">
							<td>
								<div class="font-medium">{p.nombre}</div>
								{#if p.descripcion}
									<div class="text-xs text-base-content/50 mt-0.5 max-w-xs truncate">{p.descripcion}</div>
								{/if}
							</td>
							<td>
								{#if p.categoria}
									<span class="badge badge-outline badge-sm">{p.categoria}</span>
								{:else}
									<span class="text-base-content/30 text-sm">—</span>
								{/if}
							</td>
							<td class="text-right font-semibold text-primary">{formatPrecio(p.precio)}</td>
							<td class="text-center">
								<span class="badge badge-sm {p.cantidad > 5 ? 'badge-success' : p.cantidad > 0 ? 'badge-warning' : 'badge-error'}">
									{p.cantidad}
								</span>
							</td>
							<td class="text-center">
								<div class="flex gap-1 justify-center">
									<button
										class="btn btn-ghost btn-xs btn-square"
										title="Editar"
										onclick={() => abrirModal(p)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									<button
										class="btn btn-ghost btn-xs btn-square text-error"
										title="Eliminar"
										onclick={() => abrirEliminar(p)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="px-4 py-2 border-t border-base-200 text-sm text-base-content/50">
			{productos.length} producto{productos.length !== 1 ? 's' : ''}
		</div>
	{/if}
</div>

<!-- Modal Crear/Editar -->
<dialog id="modal-producto" class="modal">
	<div class="modal-box w-full max-w-lg">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>
		<h3 class="font-bold text-lg mb-4">
			{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
		</h3>

		<div class="flex flex-col gap-4">
			<label class="form-control">
				<div class="label"><span class="label-text font-medium">Nombre *</span></div>
				<input
					type="text"
					class="input input-bordered"
					placeholder="Nombre del producto"
					bind:value={fNombre}
				/>
			</label>

			<label class="form-control">
				<div class="label"><span class="label-text font-medium">Descripción</span></div>
				<textarea
					class="textarea textarea-bordered"
					placeholder="Descripción opcional"
					rows="2"
					bind:value={fDescripcion}
				></textarea>
			</label>

			<div class="grid grid-cols-2 gap-4">
				<label class="form-control">
					<div class="label"><span class="label-text font-medium">Precio (COP) *</span></div>
					<input
						type="number"
						class="input input-bordered"
						placeholder="0"
						min="0"
						step="100"
						bind:value={fPrecio}
					/>
				</label>

				<label class="form-control">
					<div class="label"><span class="label-text font-medium">Cantidad *</span></div>
					<input
						type="number"
						class="input input-bordered"
						placeholder="0"
						min="0"
						bind:value={fCantidad}
					/>
				</label>
			</div>

			<label class="form-control">
				<div class="label"><span class="label-text font-medium">Categoría</span></div>
				<select class="select select-bordered" bind:value={fCategoriaId}>
					<option value="">Sin categoría</option>
					{#each categorias as cat}
						<option value={String(cat.id)}>{cat.nombre}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="modal-action">
			<form method="dialog">
				<button class="btn btn-ghost">Cancelar</button>
			</form>
			<button
				class="btn btn-primary"
				disabled={!fNombre.trim() || guardando}
				onclick={guardar}
			>
				{#if guardando}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				{productoEditando ? 'Guardar cambios' : 'Crear producto'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>cerrar</button>
	</form>
</dialog>

<!-- Modal Eliminar -->
<dialog id="modal-eliminar" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">¿Eliminar producto?</h3>
		<p class="py-4">
			¿Estás seguro de eliminar <strong>{productoEliminar?.nombre}</strong>? Esta acción no se puede deshacer.
		</p>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn btn-ghost">Cancelar</button>
			</form>
			<button class="btn btn-error" disabled={guardando} onclick={confirmarEliminar}>
				{#if guardando}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Eliminar
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>cerrar</button>
	</form>
</dialog>
