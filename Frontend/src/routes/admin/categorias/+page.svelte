<script lang="ts">
	import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import type { Categoria } from '$lib/types';

	let categorias = $state<Categoria[]>([]);
	let cargando = $state(true);
	let guardando = $state(false);

	// Modal estado
	let categoriaEditando = $state<Categoria | null>(null);
	let categoriaEliminar = $state<Categoria | null>(null);

	// Formulario
	let fNombre = $state('');
	let fDescripcion = $state('');

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
		cargar();
	});

	async function cargar() {
		cargando = true;
		try {
			categorias = await getCategorias({ tenderoId: $authStore.usuario?.id });
		} catch {
			mostrarToast('Error al cargar categorías', 'error');
		} finally {
			cargando = false;
		}
	}

	function abrirModal(c?: Categoria) {
		categoriaEditando = c ?? null;
		fNombre = c?.nombre ?? '';
		fDescripcion = c?.descripcion ?? '';
		(document.getElementById('modal-categoria') as HTMLDialogElement)?.showModal();
	}

	function abrirEliminar(c: Categoria) {
		categoriaEliminar = c;
		(document.getElementById('modal-eliminar') as HTMLDialogElement)?.showModal();
	}

	async function guardar() {
		if (!fNombre.trim()) return;
		guardando = true;
		try {
			const data = {
				nombre: fNombre.trim(),
				descripcion: fDescripcion.trim() || undefined
			};
			if (categoriaEditando) {
				await updateCategoria(categoriaEditando.id, data);
				mostrarToast('Categoría actualizada correctamente');
			} else {
				await createCategoria(data);
				mostrarToast('Categoría creada correctamente');
			}
			(document.getElementById('modal-categoria') as HTMLDialogElement)?.close();
			await cargar();
		} catch {
			mostrarToast('Error al guardar la categoría', 'error');
		} finally {
			guardando = false;
		}
	}

	async function confirmarEliminar() {
		if (!categoriaEliminar) return;
		guardando = true;
		try {
			await deleteCategoria(categoriaEliminar.id);
			mostrarToast('Categoría eliminada');
			(document.getElementById('modal-eliminar') as HTMLDialogElement)?.close();
			await cargar();
		} catch {
			mostrarToast('Error al eliminar la categoría', 'error');
		} finally {
			guardando = false;
		}
	}

	function formatFecha(fecha: string) {
		return new Date(fecha).toLocaleDateString('es-CO', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
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
		<h1 class="text-2xl font-bold">Gestión de Categorías</h1>
		<p class="text-sm text-base-content/60">Organiza tus productos por categorías</p>
	</div>
	<button class="btn btn-primary" onclick={() => abrirModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		Nueva Categoría
	</button>
</div>

<!-- Tabla -->
<div class="card bg-base-100 shadow overflow-hidden">
	{#if cargando}
		<div class="p-8 text-center">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if categorias.length === 0}
		<div class="p-12 text-center text-base-content/50">
			<p class="text-4xl mb-3">🏷️</p>
			<p class="text-lg">No hay categorías registradas</p>
			<button class="btn btn-primary btn-sm mt-4" onclick={() => abrirModal()}>Crear la primera</button>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th>Nombre</th>
						<th>Descripción</th>
						<th>Creada el</th>
						<th class="text-center">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each categorias as c}
						<tr class="hover">
							<td>
								<span class="badge badge-primary badge-outline font-medium">{c.nombre}</span>
							</td>
							<td class="text-base-content/60 text-sm max-w-xs">
								{#if c.descripcion}
									{c.descripcion}
								{:else}
									<span class="text-base-content/30">Sin descripción</span>
								{/if}
							</td>
							<td class="text-sm text-base-content/50">{formatFecha(c.creadoEn)}</td>
							<td class="text-center">
								<div class="flex gap-1 justify-center">
									<button
										class="btn btn-ghost btn-xs btn-square"
										title="Editar"
										onclick={() => abrirModal(c)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									<button
										class="btn btn-ghost btn-xs btn-square text-error"
										title="Eliminar"
										onclick={() => abrirEliminar(c)}
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
			{categorias.length} categoría{categorias.length !== 1 ? 's' : ''}
		</div>
	{/if}
</div>

<!-- Modal Crear/Editar -->
<dialog id="modal-categoria" class="modal">
	<div class="modal-box w-full max-w-md">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>
		<h3 class="font-bold text-lg mb-4">
			{categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
		</h3>

		<div class="flex flex-col gap-4">
			<label class="form-control">
				<div class="label"><span class="label-text font-medium">Nombre *</span></div>
				<input
					type="text"
					class="input input-bordered"
					placeholder="Ej: Lácteos, Bebidas, Snacks..."
					bind:value={fNombre}
				/>
			</label>

			<label class="form-control">
				<div class="label"><span class="label-text font-medium">Descripción</span></div>
				<textarea
					class="textarea textarea-bordered"
					placeholder="Descripción opcional de la categoría"
					rows="3"
					bind:value={fDescripcion}
				></textarea>
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
				{categoriaEditando ? 'Guardar cambios' : 'Crear categoría'}
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
		<h3 class="font-bold text-lg">¿Eliminar categoría?</h3>
		<p class="py-4">
			¿Estás seguro de eliminar la categoría <strong>{categoriaEliminar?.nombre}</strong>? Los productos asociados quedarán sin categoría.
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
