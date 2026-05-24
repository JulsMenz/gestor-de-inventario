<script lang="ts">
	import { iniciarSesion } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let cargando = $state(false);
	let error = $state('');

	async function ingresar(e: SubmitEvent) {
		e.preventDefault();
		if (!email || !password) return;
		cargando = true;
		error = '';
		try {
			const { token, usuario } = await iniciarSesion({ email, password });
			authStore.login(token, usuario);
			goto(usuario.tipo === 'tendero' ? '/admin/pedidos' : '/');
		} catch (err: any) {
			error = err.message ?? 'Error al iniciar sesión';
		} finally {
			cargando = false;
		}
	}
</script>

<div class="min-h-[70vh] flex items-center justify-center">
	<div class="card bg-base-100 shadow-xl w-full max-w-sm">
		<div class="card-body">
			<h1 class="card-title text-2xl justify-center mb-2">Iniciar sesión</h1>
			<p class="text-center text-base-content/60 text-sm mb-4">
				¿No tienes cuenta? <a href="/registro" class="link link-primary">Regístrate</a>
			</p>

			{#if error}
				<div class="alert alert-error mb-2 py-2 text-sm">
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={ingresar} class="flex flex-col gap-4">
				<label class="form-control">
					<div class="label"><span class="label-text">Email</span></div>
					<input
						type="email"
						class="input input-bordered"
						placeholder="tu@email.com"
						bind:value={email}
						required
					/>
				</label>

				<label class="form-control">
					<div class="label"><span class="label-text">Contraseña</span></div>
					<input
						type="password"
						class="input input-bordered"
						placeholder="••••••"
						bind:value={password}
						required
					/>
				</label>

				<button type="submit" class="btn btn-primary" disabled={cargando}>
					{#if cargando}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Ingresar
				</button>
			</form>

			<div class="divider text-xs">o continúa sin cuenta</div>
			<a href="/" class="btn btn-ghost btn-sm">Ver catálogo como invitado</a>
		</div>
	</div>
</div>
