<script setup lang="ts">
import {
  Banknote,
  ShoppingBag,
  Clock,
  Flame,
  TrendingUp,
  ArrowRight,
  RefreshCw
} from 'lucide-vue-next'
import { formatRupiah, formatDateJakarta, ORDER_TYPE_LABELS } from '~~/shared/utils/format'
import type { OrderStatus, OrderType } from '~~/shared/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Dashboard Admin' })

const days = ref(7)

interface DashboardResponse {
  data: {
    summary: {
      todaySales: number
      todayOrdersCount: number
      totalOrders: number
      newOrders: number
      processingOrders: number
    }
    salesChart: Array<{ date: string; label: string; revenue: number; orders: number }>
    bestSellers: Array<{
      productId: string
      productName: string
      totalQuantity: number
      totalRevenue: number
    }>
    recentOrders: Array<{
      id: string
      orderNumber: string
      customerName: string
      orderType: OrderType
      status: OrderStatus
      totalAmount: number
      createdAt: string
    }>
  }
}

const { data: res, pending, error, refresh } = await useFetch<DashboardResponse>('/api/admin/dashboard', {
  query: computed(() => ({ days: days.value }))
})

const summary = computed(() => res.value?.data.summary)
const salesChart = computed(() => res.value?.data.salesChart || [])
const bestSellers = computed(() => res.value?.data.bestSellers || [])
const recentOrders = computed(() => res.value?.data.recentOrders || [])

const maxChartRevenue = computed(() =>
  Math.max(1, ...salesChart.value.map((d) => d.revenue))
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Ringkasan Dashboard</h2>
        <p class="text-xs sm:text-sm text-stone-500">
          Pantau performa penjualan harian, pesanan masuk, dan menu terlaris Warung Makan TrioCentil.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer self-start sm:self-auto"
        @click="refresh()"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="pending ? 'animate-spin' : ''" />
        Muat Ulang
      </button>
    </div>

    <div v-if="error" class="p-6 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700">
      Gagal memuat data dashboard. Pastikan database TiDB Cloud aktif dan Anda masuk sebagai Admin.
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-stone-500 uppercase">Penjualan Hari Ini</span>
          <div class="w-9 h-9 rounded-xl bg-pink-100 text-[#EC4899] flex items-center justify-center">
            <Banknote class="w-5 h-5" />
          </div>
        </div>
        <p class="font-display font-extrabold text-2xl text-[#292524] mt-3">
          {{ formatRupiah(summary?.todaySales || 0) }}
        </p>
        <p class="text-xs text-stone-500 mt-1">
          {{ summary?.todayOrdersCount || 0 }} pesanan valid hari ini
        </p>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-stone-500 uppercase">Total Pesanan</span>
          <div class="w-9 h-9 rounded-xl bg-amber-100 text-[#9D174D] flex items-center justify-center">
            <ShoppingBag class="w-5 h-5" />
          </div>
        </div>
        <p class="font-display font-extrabold text-2xl text-[#292524] mt-3">
          {{ summary?.totalOrders || 0 }}
        </p>
        <p class="text-xs text-stone-500 mt-1">Akumulasi seluruh pesanan</p>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-stone-500 uppercase">Pesanan Baru</span>
          <div class="w-9 h-9 rounded-xl bg-red-100 text-[#E11D48] flex items-center justify-center">
            <Clock class="w-5 h-5" />
          </div>
        </div>
        <p class="font-display font-extrabold text-2xl text-[#E11D48] mt-3">
          {{ summary?.newOrders || 0 }}
        </p>
        <p class="text-xs text-stone-500 mt-1">Menunggu konfirmasi kasir</p>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-stone-500 uppercase">Sedang Diproses</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Flame class="w-5 h-5" />
          </div>
        </div>
        <p class="font-display font-extrabold text-2xl text-[#292524] mt-3">
          {{ summary?.processingOrders || 0 }}
        </p>
        <p class="text-xs text-stone-500 mt-1">Dikonfirmasi / dimasak / diantar</p>
      </div>
    </div>

    <!-- Chart & Best Sellers -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Sales Bar Chart -->
      <section class="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-display font-bold text-base text-[#292524] flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-[#EC4899]" />
              Grafik Penjualan
            </h3>
            <p class="text-xs text-stone-500">Pendapatan harian (tidak termasuk pesanan dibatalkan)</p>
          </div>
          <div class="flex gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              v-for="opt in [7, 14, 30]"
              :key="opt"
              type="button"
              class="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              :class="days === opt ? 'bg-[#EC4899] text-white' : 'text-stone-600 hover:text-stone-900'"
              @click="days = opt"
            >
              {{ opt }} Hari
            </button>
          </div>
        </div>

        <div class="h-60 flex items-end gap-1.5 sm:gap-2 pt-6 overflow-x-auto">
          <div
            v-for="point in salesChart"
            :key="point.date"
            class="flex-1 min-w-8 flex flex-col items-center justify-end h-full group"
          >
            <div class="text-[10px] font-bold text-[#9D174D] mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {{ formatRupiah(point.revenue) }}
            </div>
            <div class="w-full flex-1 flex items-end">
              <div
                class="w-full rounded-t-lg bg-gradient-to-t from-[#EC4899] to-pink-400 group-hover:from-[#E11D48] group-hover:to-[#EC4899] transition-all min-h-1"
                :style="{ height: `${Math.max(4, Math.round((point.revenue / maxChartRevenue) * 100))}%` }"
                :title="`${point.label}: ${formatRupiah(point.revenue)} (${point.orders} pesanan)`"
              />
            </div>
            <span class="text-[10px] text-stone-500 mt-2 whitespace-nowrap">{{ point.label }}</span>
          </div>
        </div>
      </section>

      <!-- Best Sellers -->
      <section class="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <h3 class="font-display font-bold text-base text-[#292524]">Produk Terlaris</h3>
        <div v-if="bestSellers.length === 0" class="py-8 text-center text-xs text-stone-400">
          Belum ada data penjualan produk.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(item, idx) in bestSellers"
            :key="item.productId"
            class="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FFF5F8]/70 border border-pink-100"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-[#EC4899] text-white font-bold text-xs flex items-center justify-center shrink-0">
                #{{ idx + 1 }}
              </span>
              <div class="min-w-0">
                <p class="font-bold text-xs text-[#292524] truncate">{{ item.productName }}</p>
                <p class="text-[11px] text-stone-500">{{ item.totalQuantity }} terjual</p>
              </div>
            </div>
            <span class="font-bold text-xs text-[#9D174D] shrink-0">
              {{ formatRupiah(item.totalRevenue) }}
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- Recent Orders Table -->
    <section class="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
      <div class="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <h3 class="font-display font-bold text-base text-[#292524]">Riwayat Pesanan Terbaru</h3>
        <NuxtLink
          to="/admin/pesanan"
          class="inline-flex items-center gap-1 text-xs font-bold text-[#EC4899] hover:underline"
        >
          Kelola Semua Pesanan
          <ArrowRight class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-stone-50 text-stone-500 font-bold uppercase text-[11px]">
            <tr>
              <th class="px-5 py-3">No. Pesanan</th>
              <th class="px-5 py-3">Pelanggan</th>
              <th class="px-5 py-3">Layanan</th>
              <th class="px-5 py-3">Total</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Waktu</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-if="recentOrders.length === 0">
              <td colspan="6" class="px-5 py-8 text-center text-stone-400">
                Belum ada pesanan masuk.
              </td>
            </tr>
            <tr v-for="ord in recentOrders" :key="ord.id" class="hover:bg-pink-50/30">
              <td class="px-5 py-3.5 font-mono font-bold text-[#9D174D]">
                <NuxtLink :to="`/admin/pesanan?search=${ord.orderNumber}`" class="hover:underline">
                  {{ ord.orderNumber }}
                </NuxtLink>
              </td>
              <td class="px-5 py-3.5 font-semibold text-[#292524]">{{ ord.customerName }}</td>
              <td class="px-5 py-3.5 text-stone-600">{{ ORDER_TYPE_LABELS[ord.orderType] }}</td>
              <td class="px-5 py-3.5 font-bold text-[#292524]">{{ formatRupiah(ord.totalAmount) }}</td>
              <td class="px-5 py-3.5">
                <OrderStatusBadge :status="ord.status" />
              </td>
              <td class="px-5 py-3.5 text-stone-500 whitespace-nowrap">
                {{ formatDateJakarta(ord.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
