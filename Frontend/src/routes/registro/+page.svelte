<script lang="ts">
	import { registrarse } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { TipoUsuario } from '$lib/types';

	let nombre = $state('');
	let email = $state('');
	let password = $state('');
	let tipo = $state<TipoUsuario>('cliente');
	let nombreTienda = $state('');
	let cargando = $state(false);
	let error = $state('');

	async function registrar(e: SubmitEvent) {
		e.preventDefault();
		if (!nombre || !email || !password) return;
		if (tipo === 'tendero' && !nombreTienda.trim()) {
			error = 'Ingresa el nombre de tu tienda';
			return;
		}
		cargando = true;
		error = '';
		try {
			const { token, usuario } = await registrarse({
				nombre,
				email,
				password,
				tipo,
				nombreTienda: tipo === 'tendero' ? nombreTienda.trim() : undefined,
			});
			authStore.login(token, usuario);
			goto(usuario.tipo === 'tendero' ? '/admin/pedidos' : '/');
		} catch (err: any) {
			error = err.message ?? 'Error al crear la cuenta';
		} finally {
			cargando = false;
		}
	}
</script>

<div class="min-h-[70vh] flex items-center justify-center">
	<div class="card bg-base-100 shadow-xl w-full max-w-sm">
		<div class="card-body">
			<h1 class="card-title text-2xl justify-center mb-2">Crear cuenta</h1>
			<p class="text-center text-base-content/60 text-sm mb-4">
				¿Ya tienes cuenta? <a href="/login" class="link link-primary">Inicia sesión</a>
			</p>

			{#if error}
				<div class="alert alert-error mb-2 py-2 text-sm"><span>{error}</span></div>
			{/if}

			<form onsubmit={registrar} class="flex flex-col gap-4">
				<label class="form-control">
					<div class="label"><span class="label-text">Nombre</span></div>
					<input type="text" class="input input-bordered" placeholder="Tu nombre"
						bind:value={nombre} required minlength="2" />
				</label>

				<label class="form-control">
					<div class="label"><span class="label-text">Email</span></div>
					<input type="email" class="input input-bordered" placeholder="tu@email.com"
						bind:value={email} required />
				</label>

				<label class="form-control">
					<div class="label"><span class="label-text">Contraseña</span></div>
					<input type="password" class="input input-bordered" placeholder="Mínimo 6 caracteres"
						bind:value={password} required minlength="6" />
				</label>

				<!-- Selector de tipo -->
				<div class="form-control">
					<div class="label"><span class="label-text">Tipo de cuenta</span></div>
					<div class="grid grid-cols-2 gap-2">
						<label class="flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors
							{tipo === 'cliente' ? 'border-primary bg-primary/10' : 'border-base-300'}">
							<input type="radio" name="tipo" class="radio radio-primary radio-sm" value="cliente" bind:group={tipo} />
							<span class="text-2xl">🛒</span>
							<span class="text-sm font-medium">Cliente</span>
							<span class="text-xs text-center text-base-content/60">Haz pedidos</span>
						</label>
						<label class="flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors
							{tipo === 'tendero' ? 'border-primary bg-primary/10' : 'border-base-300'}">
							<input type="radio" name="tipo" class="radio radio-primary radio-sm" value="tendero" bind:group={tipo} />
							<span class="text-2xl">🏪</span>
							<span class="text-sm font-medium">Tendero</span>
							<span class="text-xs text-center text-base-content/60">Gestiona tu tienda</span>
						</label>
					</div>
				</div>

				<!-- Campo nombre de tienda (solo tendero) -->
				{#if tipo === 'tendero'}
					<label class="form-control">
						<div class="label">
							<span class="label-text">Nombre de tu tienda *</span>
						</div>
						<input type="text" class="input input-bordered" placeholder="Ej: Tienda de Don Juan"
							bind:value={nombreTienda} required={tipo === 'tendero'} />
						{#if nombreTienda.trim()}
							<div class="label">
								<span class="label-text-alt text-base-content/50">
									URL: /{nombreTienda.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
								</span>
							</div>
						{/if}
					</label>
				{/if}

				<button type="submit" class="btn btn-primary mt-2" disabled={cargando}>
					{#if cargando}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Crear cuenta
				</button>
			</form>
		</div>
	</div>
</div>
