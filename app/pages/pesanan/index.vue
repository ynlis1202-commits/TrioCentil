<script setup lang="ts">
import { Search, ClipboardList, ArrowRight } from 'lucide-vue-next'
import { formatRupiah, formatDateJakarta, ORDER_TYPE_LABELS } from '~~/shared/utils/format'
import type { OrderStatus, OrderType } from '~~/shared/types'

useHead({ title: 'Lacak Pesanan' })

const searchInput = ref('')
const searchMode = ref<'orderNumber' | 'whatsapp'>('orderNumber')
const searching = ref(false)
const hasSearched = ref(false)

interface TrackedOrder {
  id: string
  orderNumber: string
  customerName: string
  orderType: OrderType
  status: OrderStatus
  totalAmount: number
  createdAt: string
  items: Array<{ id: string; productName: string; quantity: number }>
}

const orders = ref<TrackedOrder[]>([])

// Load logged-in user orders initially
const { data: initialData } = await useFetch<{ data: TrackedOrder[] }>('/api/orders/track')
if (initialData.value?.data?.length) {
  orders.value = initialData.value.data
}

async function handleSearch() {
  if (!searchInput.value.trim()) return
  searching.value = true
  hasSearched.value = true
  try {
    const query =
      searchMode.value === 'orderNumber'
        ? { orderNumber: searchInput.value.trim() }
        : { whatsapp: searchInput.value.trim() }

    const res = await $fetch<{ data: TrackedOrder[] }>('/api/orders/track', { query })
    orders.value = res.data
  } finally {
    searching.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <div class="text-center space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Pelacakan Pesanan</span>
      <h1 class="font-display font-extrabold text-2xl sm:text-4xl text-[#292524]">
        Pantau Status Pesananmu
      </h1>
      <p class="text-sm text-stone-600 max-w-lg mx-auto">
        Masukkan Nomor Pesanan (contoh: TC-20261124-0001) atau Nomor WhatsApp yang digunakan saat checkout.
      </p>
    </div>

    <!-- Search Card -->
    <form
      class="bg-white rounded-3xl border border-pink-100 p-5 sm:p-6 shadow-sm space-y-4"
      @submit.prevent="handleSearch"
    >
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          :class="searchMode === 'orderNumber' ? 'bg-[#EC4899] text-white' : 'bg-[#FFF5F8] text-[#9D174D]'"
          @click="searchMode = 'orderNumber'"
        >
          Cari Nomor Pesanan
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          :class="searchMode === 'whatsapp' ? 'bg-[#EC4899] text-white' : 'bg-[#FFF5F8] text-[#9D174D]'"
          @click="searchMode = 'whatsapp'"
        >
          Cari Nomor WhatsApp
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchInput"
            type="text"
            :placeholder="searchMode === 'orderNumber' ? 'Contoh: TC-20261124-0001' : 'Contoh: 081234567890'"
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
          >
        </div>
        <button
          type="submit"
          :disabled="searching || !searchInput.trim()"
          class="px-6 py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-50 text-white font-bold text-sm cursor-pointer"
        >
          {{ searching ? 'Mencari...' : 'Lacak Pesanan' }}
        </button>
      </div>
    </form>

    <!-- Results -->
    <div v-if="orders.length > 0" class="space-y-4">
      <h2 class="font-display font-bold text-lg text-[#292524]">
        Daftar Pesanan ({{ orders.length }})
      </h2>

      <NuxtLink
        v-for="order in orders"
        :key="order.id"
        :to="`/pesanan/${order.orderNumber}`"
        class="block bg-white rounded-2xl border border-pink-100 hover:border-[#EC4899] p-5 shadow-xs transition-all"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span class="font-mono font-extrabold text-sm sm:text-base text-[#9D174D]">
              {{ order.orderNumber }}
            </span>
            <p class="text-xs text-stone-500 mt-0.5">
              {{ formatDateJakarta(order.createdAt) }} • {{ ORDER_TYPE_LABELS[order.orderType] }}
            </p>
          </div>
          <OrderStatusBadge :status="order.status" />
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-pink-50 text-sm">
          <p class="text-stone-600 truncate pr-4">
            {{ order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ') }}
          </p>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-display font-extrabold text-[#292524]">
              {{ formatRupiah(order.totalAmount) }}
            </span>
            <ArrowRight class="w-4 h-4 text-[#EC4899]" />
          </div>
        </div>
      </NuxtLink>
    </div>

    <div
      v-else-if="hasSearched"
      class="bg-white rounded-2xl border border-pink-100 p-10 text-center space-y-2"
    >
      <ClipboardList class="w-10 h-10 text-stone-300 mx-auto" />
      <p class="font-bold text-[#292524]">Pesanan tidak ditemukan</p>
      <p class="text-xs text-stone-500">
        Pastikan nomor pesanan atau nomor WhatsApp yang Anda masukkan sudah benar.
      </p>
    </div>
  </div>
</template>
