<script setup lang="ts">
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-vue-next'

useHead({ title: 'Masuk Akun' })

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    const user = await auth.login(email.value.trim(), password.value)
    toast.add({
      title: `Selamat datang, ${user.name}!`,
      color: 'success'
    })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    if (redirect) {
      await navigateTo(redirect)
    } else if (user.role === 'ADMIN' || user.role === 'STAFF') {
      await navigateTo('/admin')
    } else {
      await navigateTo('/profil')
    }
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Email atau kata sandi salah.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-12 sm:py-16">
    <div class="bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div class="text-center space-y-2">
        <div class="flex justify-center">
          <BrandLogo />
        </div>
        <h1 class="font-display font-extrabold text-2xl text-[#292524] pt-2">Masuk ke Akun</h1>
        <p class="text-xs text-stone-500">
          Masuk untuk melihat riwayat pesanan atau mengelola Dashboard Admin Warung Makan TrioCentil.
        </p>
      </div>

      <div
        v-if="errorMsg"
        class="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
      >
        <AlertCircle class="w-4 h-4 text-[#E11D48] shrink-0" />
        <span>{{ errorMsg }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="login-email" class="block text-xs font-bold text-stone-700 mb-1.5">Email</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="login-email"
              v-model="email"
              type="email"
              required
              placeholder="nama@email.com"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
            >
          </div>
        </div>

        <div>
          <label for="login-password" class="block text-xs font-bold text-stone-700 mb-1.5">Kata Sandi</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="login-password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
            >
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <span>{{ loading ? 'Memproses...' : 'Masuk Sekarang' }}</span>
        </button>
      </form>

      <p class="text-center text-xs text-stone-500">
        Belum punya akun pelanggan?
        <NuxtLink to="/register" class="font-bold text-[#EC4899] hover:underline">
          Daftar di sini
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
