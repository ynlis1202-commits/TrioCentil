<script setup lang="ts">
import { Download, Calendar, BarChart3 } from 'lucide-vue-next'
import {
  formatRupiah,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS
} from '~~/shared/utils/format'
import type { OrderType, PaymentMethod } from '~~/shared/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Laporan Penjualan - Admin' })

function toDateInput(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d)
}

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 29)

const startDate = ref(toDateInput(thirtyDaysAgo))
const endDate = ref(toDateInput(today))

function applyPreset(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  startDate.value = toDateInput(start)
  endDate.value = toDateInput(end)
}

interface ReportResponse {
  data: {
    summary: {
      totalRevenue: number
      totalOrders: number
      completedOrders: number
      cancelledOrders: number
      totalDiscount: number
      averageOrderValue: number
    }
    dailySeries: Array<{ date: string; orders: number; revenue: number }>
    paymentBreakdown: Array<{ method: PaymentMethod; count: number; total: number }>
    orderTypeBreakdown: Array<{ orderType: OrderType; count: number; total: number }>
    topProducts: Array<{ productId: string; productName: string; quantity: number; revenue: number }>
  }
}

const { data: res, pending } = await useFetch<ReportResponse>('/api/admin/reports', {
  query: computed(() => ({
    startDate: startDate.value,
    endDate: endDate.value
  }))
})

const report = computed(() => res.value?.data)
const maxDailyRev = computed(() =>
  Math.max(1, ...(report.value?.dailySeries || []).map((d) => d.revenue))
)

function exportCsv() {
  if (!report.value || !import.meta.client) return
  const rows = [
    ['Tanggal', 'Jumlah Pesanan', 'Pendapatan (IDR)'],
    ...report.value.dailySeries.map((d) => [d.date, String(d.orders), String(d.revenue)])
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-triocentil-${startDate.value}_sd_${endDate.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Laporan Penjualan</h2>
        <p class="text-xs sm:text-sm text-stone-500">
          Analisis pendapatan, metode pembayaran, jenis layanan, dan produk terlaris berdasarkan rentang tanggal.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-bold cursor-pointer self-start"
        @click="exportCsv"
      >
        <Download class="w-4 h-4" />
        Ekspor CSV
      </button>
    </div>

    <!-- Date Range Picker -->
    <div class="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="px-3 py-1.5 rounded-xl bg-pink-50 text-[#9D174D] text-xs font-bold hover:bg-pink-100 cursor-pointer" @click="applyPreset(1)">
          Hari Ini
        </button>
        <button type="button" class="px-3 py-1.5 rounded-xl bg-pink-50 text-[#9D174D] text-xs font-bold hover:bg-pink-100 cursor-pointer" @click="applyPreset(7)">
          7 Hari
        </button>
        <button type="button" class="px-3 py-1.5 rounded-xl bg-pink-50 text-[#9D174D] text-xs font-bold hover:bg-pink-100 cursor-pointer" @click="applyPreset(30)">
          30 Hari
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <Calendar class="w-4 h-4 text-stone-400" />
        <input v-model="startDate" type="date" class="px-3 py-1.5 rounded-xl border border-stone-200 font-semibold">
        <span class="text-stone-400">s/d</span>
        <input v-model="endDate" type="date" class="px-3 py-1.5 rounded-xl border border-stone-200 font-semibold">
      </div>
    </div>

    <div v-if="pending" class="h-64 rounded-2xl bg-stone-100 animate-pulse" />

    <template v-else-if="report">
      <!-- KPI Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-stone-200 p-5">
          <p class="text-xs font-bold uppercase text-stone-400">Total Pendapatan</p>
          <p class="font-display font-extrabold text-2xl text-[#9D174D] mt-2">
            {{ formatRupiah(report.summary.totalRevenue) }}
          </p>
          <p class="text-xs text-stone-500 mt-1">Total diskon: {{ formatRupiah(report.summary.totalDiscount) }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-stone-200 p-5">
          <p class="text-xs font-bold uppercase text-stone-400">Pesanan Valid</p>
          <p class="font-display font-extrabold text-2xl text-[#292524] mt-2">
            {{ report.summary.totalOrders }}
          </p>
          <p class="text-xs text-emerald-700 mt-1">{{ report.summary.completedOrders }} selesai</p>
        </div>
        <div class="bg-white rounded-2xl border border-stone-200 p-5">
          <p class="text-xs font-bold uppercase text-stone-400">Rata-rata / Pesanan</p>
          <p class="font-display font-extrabold text-2xl text-[#EC4899] mt-2">
            {{ formatRupiah(report.summary.averageOrderValue) }}
          </p>
          <p class="text-xs text-stone-500 mt-1">Nilai keranjang rata-rata</p>
        </div>
        <div class="bg-white rounded-2xl border border-stone-200 p-5">
          <p class="text-xs font-bold uppercase text-stone-400">Dibatalkan</p>
          <p class="font-display font-extrabold text-2xl text-[#E11D48] mt-2">
            {{ report.summary.cancelledOrders }}
          </p>
          <p class="text-xs text-stone-500 mt-1">Tidak masuk omzet</p>
        </div>
      </div>

      <!-- Daily Chart -->
      <section class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h3 class="font-display font-bold text-base text-[#292524] flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-[#EC4899]" />
          Pendapatan Harian
        </h3>
        <div v-if="report.dailySeries.length === 0" class="py-10 text-center text-xs text-stone-400">
          Tidak ada transaksi pada periode ini.
        </div>
        <div v-else class="h-56 flex items-end gap-2 overflow-x-auto pt-6">
          <div
            v-for="row in report.dailySeries"
            :key="row.date"
            class="flex-1 min-w-10 flex flex-col items-center justify-end h-full group"
          >
            <span class="text-[10px] font-bold text-[#9D174D] mb-1 whitespace-nowrap">
              {{ formatRupiah(row.revenue) }}
            </span>
            <div class="w-full flex-1 flex items-end">
              <div
                class="w-full rounded-t-lg bg-[#EC4899] group-hover:bg-[#E11D48] transition-all"
                :style="{ height: `${Math.max(6, Math.round((row.revenue / maxDailyRev) * 100))}%` }"
              />
            </div>
            <span class="text-[10px] text-stone-500 mt-1.5 whitespace-nowrap">{{ row.date.slice(5) }}</span>
          </div>
        </div>
      </section>

      <!-- Breakdowns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <h3 class="font-display font-bold text-base text-[#292524]">Per Metode Pembayaran</h3>
          <div class="space-y-3">
            <div
              v-for="item in report.paymentBreakdown"
              :key="item.method"
              class="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs sm:text-sm"
            >
              <div>
                <p class="font-bold text-[#292524]">{{ PAYMENT_METHOD_LABELS[item.method] || item.method }}</p>
                <p class="text-xs text-stone-500">{{ item.count }} transaksi</p>
              </div>
              <span class="font-extrabold text-[#9D174D]">{{ formatRupiah(item.total) }}</span>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <h3 class="font-display font-bold text-base text-[#292524]">Per Jenis Pengambilan</h3>
          <div class="space-y-3">
            <div
              v-for="item in report.orderTypeBreakdown"
              :key="item.orderType"
              class="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs sm:text-sm"
            >
              <div>
                <p class="font-bold text-[#292524]">{{ ORDER_TYPE_LABELS[item.orderType] || item.orderType }}</p>
                <p class="text-xs text-stone-500">{{ item.count }} pesanan</p>
              </div>
              <span class="font-extrabold text-[#9D174D]">{{ formatRupiah(item.total) }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Top Products -->
      <section class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-stone-100">
          <h3 class="font-display font-bold text-base text-[#292524]">Menu Terlaris Periode Ini</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-stone-50 text-stone-500 font-bold uppercase text-[11px]">
              <tr>
                <th class="px-6 py-3">Menu</th>
                <th class="px-6 py-3">Jumlah Terjual</th>
                <th class="px-6 py-3 text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-if="report.topProducts.length === 0">
                <td colspan="3" class="px-6 py-8 text-center text-stone-400">Belum ada penjualan.</td>
              </tr>
              <tr v-for="p in report.topProducts" :key="p.productId">
                <td class="px-6 py-3 font-bold text-[#292524]">{{ p.productName }}</td>
                <td class="px-6 py-3 text-stone-600">{{ p.quantity }} porsi</td>
                <td class="px-6 py-3 text-right font-extrabold text-[#9D174D]">{{ formatRupiah(p.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
