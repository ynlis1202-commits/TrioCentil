<script setup lang="ts">
import { User, LogOut, ShieldCheck, ClipboardList, ShoppingBag, ArrowRight } from 'lucide-vue-next'
import { formatRupiah, formatDateJakarta } from '~~/shared/utils/format'
import type { OrderStatus } from '~~/shared/types'

useHead({ title: 'Profil Saya' })

const auth = useAuthStore()
const toast = useToast()

await auth.fetchMe()

const { data: myOrdersRes } = await useFetch<{
  data: Array<{ id: string; orderNumber: string; status: OrderStatus; totalAmount: number; createdAt: string }>
}>('/api/orders/track')

const myOrders = computed(() => myOrdersRes.value?.data || [])

async function handleLogout() {
  await auth.logout()
  toast.add({ title: 'Anda telah keluar dari akun.', color: 'primary' })
  await navigateTo('/')
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
    <div
      v-if="!auth.isAuthenticated"
      class="bg-white rounded-3xl border border-pink-100 p-10 text-center space-y-4 max-w-lg mx-auto"
    >
      <div class="w-16 h-16 rounded-2xl bg-[#FFF5F8] text-[#EC4899] flex items-center justify-center mx-auto">
        <User class="w-8 h-8" />
      </div>
      <h1 class="font-display font-bold text-2xl text-[#292524]">Masuk ke Akun Anda</h1>
      <p class="text-sm text-stone-500">
        Masuk atau daftar untuk menyimpan nomor WhatsApp, melihat riwayat pesanan, atau mengakses Panel Admin.
      </p>
      <div class="flex flex-wrap justify-center gap-3 pt-2">
        <NuxtLink
          to="/login"
          class="px-6 py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-sm"
        >
          Masuk
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="px-6 py-3 rounded-xl bg-[#FFF5F8] hover:bg-pink-100 text-[#9D174D] font-bold text-sm"
        >
          Daftar Akun
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <section class="bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-[#EC4899] text-white font-display font-extrabold text-xl flex items-center justify-center">
            {{ auth.user?.name?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <h1 class="font-display font-extrabold text-xl text-[#292524]">{{ auth.user?.name }}</h1>
            <p class="text-xs text-stone-500">{{ auth.user?.email }}</p>
            <p v-if="auth.user?.phone" class="text-xs text-stone-500 mt-0.5">WA: {{ auth.user?.phone }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-if="auth.isAdmin"
            to="/admin"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#9D174D] text-white text-xs font-bold hover:bg-[#831843]"
          >
            <ShieldCheck class="w-4 h-4" />
            Buka Dashboard Admin
          </NuxtLink>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 text-[#E11D48] hover:bg-red-100 text-xs font-bold cursor-pointer"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4" />
            Keluar
          </button>
        </div>
      </section>

      <section class="bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-display font-bold text-lg text-[#292524] flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-[#EC4899]" />
            Riwayat Pesanan Saya
          </h2>
          <NuxtLink to="/menu" class="text-xs font-bold text-[#EC4899] hover:underline">
            + Pesan Lagi
          </NuxtLink>
        </div>

        <div v-if="myOrders.length === 0" class="py-8 text-center text-sm text-stone-500 space-y-3">
          <ShoppingBag class="w-10 h-10 text-stone-300 mx-auto" />
          <p>Belum ada riwayat pesanan.</p>
          <NuxtLink
            to="/menu"
            class="inline-flex px-5 py-2.5 rounded-xl bg-[#EC4899] text-white text-xs font-bold"
          >
            Mulai Pesan Sate Ayam
          </NuxtLink>
        </div>

        <div v-else class="divide-y divide-pink-50">
          <NuxtLink
            v-for="ord in myOrders"
            :key="ord.id"
            :to="`/pesanan/${ord.orderNumber}`"
            class="py-3.5 flex items-center justify-between gap-3 hover:bg-pink-50/40 px-2 rounded-xl transition-colors"
          >
            <div>
              <p class="font-mono font-bold text-sm text-[#9D174D]">{{ ord.orderNumber }}</p>
              <p class="text-xs text-stone-500">{{ formatDateJakarta(ord.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <OrderStatusBadge :status="ord.status" />
              <span class="font-bold text-sm text-[#292524] hidden sm:inline">
                {{ formatRupiah(ord.totalAmount) }}
              </span>
              <ArrowRight class="w-4 h-4 text-stone-400" />
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>
