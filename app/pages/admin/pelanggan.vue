<script setup lang="ts">
import { Search, MessageCircle, MapPin } from 'lucide-vue-next'
import { formatRupiah, formatDateJakarta, normalizeWhatsappNumber } from '~~/shared/utils/format'
import type { OrderStatus } from '~~/shared/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Data Pelanggan - Admin' })

const search = ref('')

interface AdminCustomer {
  id: string
  name: string
  whatsapp: string
  email: string | null
  defaultAddress: string | null
  totalOrders: number
  totalSpent: number
  createdAt: string
  orders: Array<{
    id: string
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    createdAt: string
  }>
}

const { data: res, pending } = await useFetch<{ data: AdminCustomer[] }>('/api/admin/customers', {
  query: computed(() => ({
    search: search.value.trim() || undefined
  }))
})

const customers = computed(() => res.value?.data || [])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-display font-extrabold text-2xl text-[#292524]">Data Pelanggan</h2>
      <p class="text-xs sm:text-sm text-stone-500">
        Daftar pelanggan terdaftar & pembeli online beserta total pesanan dan riwayat belanja.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-stone-200 p-4">
      <div class="relative max-w-md">
        <Search class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="search"
          placeholder="Cari nama, WhatsApp, atau email pelanggan..."
          class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]"
        >
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-stone-50 text-stone-500 font-bold uppercase text-[11px]">
            <tr>
              <th class="px-5 py-3">Pelanggan</th>
              <th class="px-5 py-3">Alamat Terakhir</th>
              <th class="px-5 py-3">Total Pesanan</th>
              <th class="px-5 py-3">Total Belanja</th>
              <th class="px-5 py-3">Pesanan Terakhir</th>
              <th class="px-5 py-3 text-right">Kontak</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-if="pending">
              <td colspan="6" class="px-5 py-10 text-center text-stone-400">Memuat data pelanggan...</td>
            </tr>
            <tr v-else-if="customers.length === 0">
              <td colspan="6" class="px-5 py-10 text-center text-stone-400">Belum ada data pelanggan.</td>
            </tr>
            <tr v-for="cust in customers" :key="cust.id" class="hover:bg-pink-50/30">
              <td class="px-5 py-3.5">
                <p class="font-bold text-[#292524]">{{ cust.name }}</p>
                <p class="text-xs text-stone-500">{{ cust.whatsapp }}</p>
                <p v-if="cust.email" class="text-[11px] text-stone-400">{{ cust.email }}</p>
              </td>
              <td class="px-5 py-3.5 max-w-xs text-xs text-stone-600">
                <span v-if="cust.defaultAddress" class="inline-flex items-start gap-1">
                  <MapPin class="w-3.5 h-3.5 text-[#EC4899] shrink-0 mt-0.5" />
                  <span class="line-clamp-2">{{ cust.defaultAddress }}</span>
                </span>
                <span v-else class="text-stone-400">-</span>
              </td>
              <td class="px-5 py-3.5 font-bold text-[#292524]">{{ cust.totalOrders }}x</td>
              <td class="px-5 py-3.5 font-extrabold text-[#9D174D]">{{ formatRupiah(cust.totalSpent) }}</td>
              <td class="px-5 py-3.5 text-xs">
                <div v-if="cust.orders[0]">
                  <NuxtLink
                    :to="`/admin/pesanan?search=${cust.orders[0].orderNumber}`"
                    class="font-mono font-bold text-[#EC4899] hover:underline"
                  >
                    {{ cust.orders[0].orderNumber }}
                  </NuxtLink>
                  <p class="text-[11px] text-stone-400">{{ formatDateJakarta(cust.orders[0].createdAt, false) }}</p>
                </div>
                <span v-else class="text-stone-400">-</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <a
                  :href="`https://wa.me/${normalizeWhatsappNumber(cust.whatsapp)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold"
                >
                  <MessageCircle class="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
