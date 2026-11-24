<script setup lang="ts">
import { User, Mail, Phone, Lock, Loader2, AlertCircle } from 'lucide-vue-next'

useHead({ title: 'Daftar Akun Pelanggan' })

const auth = useAuthStore()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: ''
})
const loading = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.register(form)
    toast.add({
      title: 'Pendaftaran Berhasil!',
      description: 'Selamat datang di Warung Makan TrioCentil.',
      color: 'success'
    })
    await navigateTo('/profil')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Gagal mendaftar. Periksa kembali data Anda.'
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
        <h1 class="font-display font-extrabold text-2xl text-[#292524] pt-2">Buat Akun Pelanggan</h1>
        <p class="text-xs text-stone-500">
          Simpan data pemesanan dan pantau seluruh riwayat pesananmu lebih praktis.
        </p>
      </div>

      <div
        v-if="errorMsg"
        class="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
      >
        <AlertCircle class="w-4 h-4 text-[#E11D48] shrink-0" />
        <span>{{ errorMsg }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1.5">Nama Lengkap</label>
          <div class="relative">
            <User class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Budi Santoso"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1.5">Email</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="budi@email.com"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1.5">Nomor WhatsApp</label>
          <div class="relative">
            <Phone class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.phone"
              type="tel"
              required
              placeholder="081234567890"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1.5">Kata Sandi (Min. 6 karakter)</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.password"
              type="password"
              required
              minlength="6"
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
          <span>{{ loading ? 'Mendaftar...' : 'Daftar Sekarang' }}</span>
        </button>
      </form>

      <p class="text-center text-xs text-stone-500">
        Sudah punya akun?
        <NuxtLink to="/login" class="font-bold text-[#EC4899] hover:underline">
          Masuk di sini
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
