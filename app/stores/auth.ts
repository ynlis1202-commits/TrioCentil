import { defineStore } from 'pinia'
import type { AuthUser } from '~~/shared/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loaded = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'STAFF')

  async function fetchMe(force = false) {
    if (loaded.value && !force) return user.value
    loading.value = true
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const res = await $fetch<{ data: AuthUser | null }>('/api/auth/me', { headers })
      user.value = res.data
    } catch {
      user.value = null
    } finally {
      loaded.value = true
      loading.value = false
    }
    return user.value
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ data: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = res.data
    loaded.value = true
    return res.data
  }

  async function register(payload: { name: string; email: string; phone: string; password: string }) {
    const res = await $fetch<{ data: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: payload
    })
    user.value = res.data
    loaded.value = true
    return res.data
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  return {
    user,
    loaded,
    loading,
    isAuthenticated,
    isAdmin,
    fetchMe,
    login,
    register,
    logout
  }
})
