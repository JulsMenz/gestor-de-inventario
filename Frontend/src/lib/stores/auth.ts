import { writable } from 'svelte/store';
import type { Usuario } from '$lib/types';

interface AuthState {
	token: string | null;
	usuario: Usuario | null;
}

function getInitial(): AuthState {
	if (typeof window === 'undefined') return { token: null, usuario: null };
	try {
		const stored = localStorage.getItem('auth');
		return stored ? JSON.parse(stored) : { token: null, usuario: null };
	} catch {
		return { token: null, usuario: null };
	}
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>(getInitial());

	return {
		subscribe,
		login(token: string, usuario: Usuario) {
			const state = { token, usuario };
			if (typeof window !== 'undefined') localStorage.setItem('auth', JSON.stringify(state));
			set(state);
		},
		logout() {
			if (typeof window !== 'undefined') localStorage.removeItem('auth');
			set({ token: null, usuario: null });
		},
	};
}

export const authStore = createAuthStore();
