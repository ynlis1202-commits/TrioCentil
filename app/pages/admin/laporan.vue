<script setup lang="ts">
import { FileDown, Calendar, BarChart3, Loader2 } from 'lucide-vue-next'
import {
  formatRupiah,
  formatDateJakarta,
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

const storefront = useStorefrontStore()
const toast = useToast()
const exportingPdf = ref(false)

const report = computed(() => res.value?.data)
const maxDailyRev = computed(() =>
  Math.max(1, ...(report.value?.dailySeries || []).map((d) => d.revenue))
)

async function exportPdf() {
  if (!report.value || !import.meta.client) return
  exportingPdf.value = true
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const r = report.value

    // Header Banner (Brand Soft Berry Rose)
    doc.setFillColor(157, 23, 77) // #9D174D
    doc.rect(0, 0, 210, 34, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('WARUNG MAKAN TRIOCENTIL', 14, 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.text('LAPORAN PENJUALAN RESMI', 14, 21)
    doc.setFontSize(8.5)
    doc.text(storefront.settings.store_address || 'Jalan Trans Kalimantan, Bawas, PT Palm Agrosia Lestari Makmur', 14, 27)

    doc.setFontSize(8.5)
    doc.text(`Periode: ${startDate.value} s/d ${endDate.value}`, 196, 15, { align: 'right' })
    doc.text(`Dicetak: ${formatDateJakarta(new Date())}`, 196, 21, { align: 'right' })

    // 1. Ringkasan Penjualan
    doc.setTextColor(41, 37, 36)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('1. Ringkasan Penjualan', 14, 44)

    autoTable(doc, {
      startY: 47,
      head: [['Metrik', 'Nilai']],
      body: [
        ['Total Pendapatan', formatRupiah(r.summary.totalRevenue)],
        ['Total Pesanan Valid', `${r.summary.totalOrders} pesanan (${r.summary.completedOrders} selesai)`],
        ['Rata-rata Nilai / Pesanan', formatRupiah(r.summary.averageOrderValue)],
        ['Total Diskon Promo', formatRupiah(r.summary.totalDiscount)],
        ['Pesanan Dibatalkan', `${r.summary.cancelledOrders} pesanan`]
      ],
      headStyles: { fillColor: [236, 72, 153], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      styles: { fontSize: 9, cellPadding: 2.8 }
    })

    // 2. Pendapatan Harian
    const afterSummaryY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 95
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('2. Rincian Pendapatan Harian', 14, afterSummaryY)

    autoTable(doc, {
      startY: afterSummaryY + 3,
      head: [['Tanggal', 'Jumlah Pesanan', 'Pendapatan (IDR)']],
      body:
        r.dailySeries.length > 0
          ? r.dailySeries.map((d) => [d.date, `${d.orders} pesanan`, formatRupiah(d.revenue)])
          : [['-', '0 pesanan', 'Rp 0']],
      headStyles: { fillColor: [157, 23, 77], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    })

    // 3. Metode Pembayaran & Jenis Layanan
    const afterDailyY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 150
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('3. Rincian Metode Pembayaran & Jenis Layanan', 14, afterDailyY)

    autoTable(doc, {
      startY: afterDailyY + 3,
      head: [['Kategori', 'Keterangan', 'Jumlah', 'Total (IDR)']],
      body: [
        ...r.paymentBreakdown.map((p) => [
          'Metode Bayar',
          PAYMENT_METHOD_LABELS[p.method] || p.method,
          `${p.count} transaksi`,
          formatRupiah(p.total)
        ]),
        ...r.orderTypeBreakdown.map((o) => [
          'Jenis Layanan',
          ORDER_TYPE_LABELS[o.orderType] || o.orderType,
          `${o.count} pesanan`,
          formatRupiah(o.total)
        ])
      ],
      headStyles: { fillColor: [236, 72, 153], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    })

    // 4. Menu Terlaris
    const afterBreakY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 205
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('4. Menu Terlaris Periode Ini', 14, afterBreakY)

    autoTable(doc, {
      startY: afterBreakY + 3,
      head: [['No', 'Nama Menu', 'Jumlah Terjual', 'Total Penjualan (IDR)']],
      body:
        r.topProducts.length > 0
          ? r.topProducts.map((p, idx) => [
              String(idx + 1),
              p.productName,
              `${p.quantity} porsi`,
              formatRupiah(p.revenue)
            ])
          : [['-', 'Belum ada penjualan', '0 porsi', 'Rp 0']],
      headStyles: { fillColor: [157, 23, 77], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    })

    doc.save(`laporan-penjualan-triocentil-${startDate.value}_sd_${endDate.value}.pdf`)
    toast.add({
      title: 'Laporan PDF Berhasil Diunduh!',
      color: 'success'
    })
  } catch (err) {
    console.error('Export PDF failed:', err)
    toast.add({
      title: 'Gagal mengekspor PDF',
      description: 'Silakan coba lagi sebentar.',
      color: 'error'
    })
  } finally {
    exportingPdf.value = false
  }
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
        :disabled="exportingPdf || !report"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9D174D] hover:bg-[#831843] disabled:opacity-50 text-white text-xs font-bold cursor-pointer self-start"
        @click="exportPdf"
      >
        <Loader2 v-if="exportingPdf" class="w-4 h-4 animate-spin" />
        <FileDown v-else class="w-4 h-4" />
        <span>{{ exportingPdf ? 'Membuat PDF...' : 'Ekspor PDF' }}</span>
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
