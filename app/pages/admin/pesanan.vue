<script setup lang="ts">
import { Search, Eye, MessageCircle, X, RefreshCw, Image as ImageIcon, Download, Lock, Unlock, ShieldCheck } from 'lucide-vue-next'
import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '~~/shared/types'
import {
  formatRupiah,
  formatDateJakarta,
  ORDER_STATUS_META,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  normalizeWhatsappNumber
} from '~~/shared/utils/format'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Kelola Pesanan - Admin' })

const route = useRoute()
const toast = useToast()

const statusFilter = ref<string>('ALL')
const search = ref<string>((route.query.search as string) || '')

watch(
  () => route.query.search,
  (val) => {
    if (typeof val === 'string') {
      search.value = val
      statusFilter.value = 'ALL'
    }
  }
)

interface AdminOrder {
  id: string
  orderNumber: string
  customerName: string
  customerWhatsapp: string
  orderType: OrderType
  deliveryAddress: string | null
  tableNumber: string | null
  notes: string | null
  subtotal: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
  status: OrderStatus
  createdAt: string
  items: Array<{
    id: string
    productName: string
    unitPrice: number
    quantity: number
    spicyLevel: string | null
    extraSambal: string | null
    itemNotes: string | null
    lineTotal: number
  }>
  payment: {
    method: PaymentMethod
    status: PaymentStatus
    amount: number
    referenceCode: string | null
    proofUrl: string | null
  } | null
  statusHistories: Array<{
    id: string
    toStatus: OrderStatus
    note: string | null
    createdAt: string
    changedBy?: { name: string } | null
  }>
}

const { data: res, pending, refresh } = await useFetch<{ data: AdminOrder[] }>('/api/admin/orders', {
  query: computed(() => ({
    status: statusFilter.value,
    search: search.value.trim() || undefined
  }))
})

const orders = computed(() => res.value?.data || [])
const selectedOrder = ref<AdminOrder | null>(null)
const nextStatus = ref<OrderStatus>('CONFIRMED')
const statusNote = ref('')
const nextPaymentStatus = ref<PaymentStatus>('PENDING')
const updating = ref(false)
const proofModalUrl = ref<string | null>(null)

// Cashier PIN lock state for CASH (Bayar di Tempat) payment section
const cashPaymentUnlocked = ref(false)
const cashierPinInput = ref('')
const verifiedCashierPin = ref('')
const verifyingPin = ref(false)
const pinError = ref('')

const allStatuses: OrderStatus[] = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'COOKING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED'
]

function openDetail(order: AdminOrder) {
  selectedOrder.value = order
  nextStatus.value = order.status
  statusNote.value = ''
  nextPaymentStatus.value = order.payment?.status || 'PENDING'
  // Always lock CASH payment section until cashier enters PIN
  cashPaymentUnlocked.value = order.payment?.method !== 'CASH'
  cashierPinInput.value = ''
  verifiedCashierPin.value = ''
  pinError.value = ''
}

function closeDetail() {
  selectedOrder.value = null
  cashPaymentUnlocked.value = false
  cashierPinInput.value = ''
  verifiedCashierPin.value = ''
  pinError.value = ''
}

async function unlockCashPayment() {
  pinError.value = ''
  if (cashierPinInput.value.trim().length < 4) {
    pinError.value = 'Masukkan PIN Kasir minimal 4 digit.'
    return
  }
  verifyingPin.value = true
  try {
    await $fetch('/api/admin/orders/verify-cashier-pin', {
      method: 'POST',
      body: { pin: cashierPinInput.value.trim() }
    })
    verifiedCashierPin.value = cashierPinInput.value.trim()
    cashPaymentUnlocked.value = true
    cashierPinInput.value = ''
    toast.add({
      title: 'Pembayaran Tunai Dibuka',
      description: 'PIN Kasir terverifikasi.',
      color: 'success'
    })
  } catch (err: any) {
    pinError.value = err?.data?.statusMessage || 'PIN Kasir salah.'
  } finally {
    verifyingPin.value = false
  }
}

function lockCashPayment() {
  cashPaymentUnlocked.value = false
  verifiedCashierPin.value = ''
  cashierPinInput.value = ''
  pinError.value = ''
}

async function updateOrderStatus() {
  if (!selectedOrder.value) return
  updating.value = true
  try {
    const updated = await $fetch<{ data: AdminOrder }>(`/api/admin/orders/${selectedOrder.value.id}/status`, {
      method: 'PATCH',
      body: {
        status: nextStatus.value,
        note: statusNote.value.trim() || undefined
      }
    })
    selectedOrder.value = updated.data
    statusNote.value = ''
    toast.add({ title: 'Status pesanan berhasil diperbarui!', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal memperbarui status',
      description: err?.data?.statusMessage || 'Terjadi kesalahan.',
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}

async function updatePayment() {
  if (!selectedOrder.value) return
  if (selectedOrder.value.payment?.method === 'CASH' && !verifiedCashierPin.value) {
    pinError.value = 'Silakan verifikasi PIN Kasir terlebih dahulu.'
    cashPaymentUnlocked.value = false
    return
  }
  updating.value = true
  try {
    await $fetch(`/api/admin/orders/${selectedOrder.value.id}/payment`, {
      method: 'PATCH',
      body: {
        status: nextPaymentStatus.value,
        ...(selectedOrder.value.payment?.method === 'CASH'
          ? { cashierPin: verifiedCashierPin.value }
          : {})
      }
    })
    if (selectedOrder.value.payment) {
      selectedOrder.value.payment.status = nextPaymentStatus.value
    }
    toast.add({ title: 'Status pembayaran diperbarui!', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal memperbarui pembayaran',
      description: err?.data?.statusMessage || 'Pastikan PIN Kasir valid.',
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}

function customerWaLink(order: AdminOrder) {
  const msg = `Halo Kak ${order.customerName}, ini dari Warung Makan TrioCentil terkait pesanan #${order.orderNumber} (Status: ${ORDER_STATUS_META[order.status].label}).`
  return `https://wa.me/${normalizeWhatsappNumber(order.customerWhatsapp)}?text=${encodeURIComponent(msg)}`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Manajemen Pesanan</h2>
        <p class="text-xs sm:text-sm text-stone-500">
          Konfirmasi pesanan masuk, pantau proses masak, verifikasi pembayaran, dan perbarui status pengiriman.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer self-start"
        @click="refresh()"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="pending ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
      <div class="relative">
        <Search class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="search"
          placeholder="Cari nomor pesanan, nama pelanggan, atau nomor WhatsApp..."
          class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]"
        >
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          :class="statusFilter === 'ALL' ? 'bg-[#EC4899] text-white' : 'bg-stone-100 text-stone-600'"
          @click="statusFilter = 'ALL'"
        >
          Semua
        </button>
        <button
          v-for="st in allStatuses"
          :key="st"
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          :class="statusFilter === st ? 'bg-[#EC4899] text-white' : 'bg-stone-100 text-stone-600'"
          @click="statusFilter = st"
        >
          {{ ORDER_STATUS_META[st].label }}
        </button>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-stone-50 text-stone-500 font-bold uppercase text-[11px]">
            <tr>
              <th class="px-5 py-3">Pesanan</th>
              <th class="px-5 py-3">Pelanggan</th>
              <th class="px-5 py-3">Layanan & Bayar</th>
              <th class="px-5 py-3">Total</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-if="pending">
              <td colspan="6" class="px-5 py-10 text-center text-stone-400">Memuat daftar pesanan...</td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="6" class="px-5 py-10 text-center text-stone-400">Tidak ada pesanan yang cocok.</td>
            </tr>
            <tr v-for="ord in orders" :key="ord.id" class="hover:bg-pink-50/30">
              <td class="px-5 py-3.5">
                <p class="font-mono font-bold text-[#9D174D]">{{ ord.orderNumber }}</p>
                <p class="text-[11px] text-stone-400">{{ formatDateJakarta(ord.createdAt) }}</p>
              </td>
              <td class="px-5 py-3.5">
                <p class="font-bold text-[#292524]">{{ ord.customerName }}</p>
                <p class="text-xs text-stone-500">{{ ord.customerWhatsapp }}</p>
              </td>
              <td class="px-5 py-3.5">
                <p class="font-semibold text-stone-700">{{ ORDER_TYPE_LABELS[ord.orderType] }}</p>
                <div v-if="ord.payment" class="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span class="text-[11px] text-stone-500">{{ PAYMENT_METHOD_LABELS[ord.payment.method] }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    :class="[
                      PAYMENT_STATUS_META[ord.payment.status].bgClass,
                      PAYMENT_STATUS_META[ord.payment.status].textClass
                    ]"
                  >
                    {{ PAYMENT_STATUS_META[ord.payment.status].label }}
                  </span>
                  <span
                    v-if="ord.payment.proofUrl"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-pink-100 text-[#9D174D] text-[10px] font-bold"
                  >
                    <ImageIcon class="w-3 h-3" />
                    Bukti
                  </span>
                </div>
              </td>
              <td class="px-5 py-3.5 font-extrabold text-[#292524]">{{ formatRupiah(ord.totalAmount) }}</td>
              <td class="px-5 py-3.5">
                <OrderStatusBadge :status="ord.status" />
              </td>
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EC4899] text-white text-xs font-bold hover:bg-[#DB2777] cursor-pointer"
                  @click="openDetail(ord)"
                >
                  <Eye class="w-3.5 h-3.5" />
                  Proses
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Detail & Status Management Modal -->
    <div v-if="selectedOrder" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 class="font-mono font-extrabold text-lg text-[#9D174D]">{{ selectedOrder.orderNumber }}</h3>
            <p class="text-xs text-stone-500">{{ formatDateJakarta(selectedOrder.createdAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="customerWaLink(selectedOrder)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              <MessageCircle class="w-3.5 h-3.5" />
              Chat WA
            </a>
            <button type="button" class="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer" @click="closeDetail">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Update Status & Payment Controls -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-[#FFF5F8] border border-pink-200 space-y-3">
              <label class="block text-xs font-bold text-[#9D174D]">Ubah Status Pesanan</label>
              <select v-model="nextStatus" class="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white text-sm font-semibold">
                <option v-for="st in allStatuses" :key="st" :value="st">
                  {{ ORDER_STATUS_META[st].label }}
                </option>
              </select>
              <input
                v-model="statusNote"
                type="text"
                placeholder="Catatan status (opsional)"
                class="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white text-xs"
              >
              <button
                type="button"
                :disabled="updating"
                class="w-full py-2 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold cursor-pointer"
                @click="updateOrderStatus"
              >
                Simpan Status Pesanan
              </button>
            </div>

            <div v-if="selectedOrder.payment" class="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <label class="block text-xs font-bold text-stone-700">
                  Status Pembayaran ({{ PAYMENT_METHOD_LABELS[selectedOrder.payment.method] }})
                </label>
                <button
                  v-if="selectedOrder.payment.method === 'CASH' && cashPaymentUnlocked"
                  type="button"
                  class="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-[#9D174D] cursor-pointer"
                  @click="lockCashPayment"
                >
                  <Lock class="w-3 h-3" />
                  Kunci
                </button>
              </div>

              <!-- PIN Lock Screen for CASH (Bayar di Tempat) -->
              <form
                v-if="selectedOrder.payment.method === 'CASH' && !cashPaymentUnlocked"
                class="p-3.5 rounded-xl bg-white border border-pink-200 space-y-2.5"
                @submit.prevent="unlockCashPayment"
              >
                <div class="flex items-center gap-2 text-xs font-bold text-[#9D174D]">
                  <Lock class="w-4 h-4 text-[#EC4899] shrink-0" />
                  <span>Terkunci — PIN Kasir Diperlukan</span>
                </div>
                <p class="text-[11px] text-stone-500 leading-relaxed">
                  Masukkan PIN Kasir untuk membuka pengaturan pembayaran <strong>Bayar di Tempat (Tunai)</strong>.
                </p>
                <input
                  v-model="cashierPinInput"
                  type="password"
                  inputmode="numeric"
                  maxlength="8"
                  autocomplete="off"
                  placeholder="Masukkan PIN Kasir (contoh: 6 digit)"
                  class="w-full px-3 py-2 rounded-xl border border-pink-200 focus:border-[#EC4899] outline-none text-sm tracking-widest font-mono bg-[#FFF5F8]"
                >
                <p v-if="pinError" class="text-[11px] font-semibold text-[#E11D48]">
                  {{ pinError }}
                </p>
                <button
                  type="submit"
                  :disabled="verifyingPin || cashierPinInput.trim().length < 4"
                  class="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  <Unlock class="w-3.5 h-3.5" />
                  <span>{{ verifyingPin ? 'Memverifikasi...' : 'Buka Pembayaran Kasir' }}</span>
                </button>
              </form>

              <!-- Unlocked Payment Controls -->
              <template v-else>
                <div
                  v-if="selectedOrder.payment.method === 'CASH'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold"
                >
                  <ShieldCheck class="w-3.5 h-3.5" />
                  <span>PIN Kasir Terverifikasi</span>
                </div>
                <select v-model="nextPaymentStatus" class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold">
                  <option value="PENDING">Menunggu Pembayaran</option>
                  <option value="PAID">Lunas</option>
                  <option value="FAILED">Gagal</option>
                  <option value="REFUNDED">Dikembalikan</option>
                </select>
                <p class="text-xs text-stone-500">
                  Nominal: <strong class="text-[#292524]">{{ formatRupiah(selectedOrder.payment.amount) }}</strong>
                </p>
                <button
                  type="button"
                  :disabled="updating"
                  class="w-full py-2 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-bold cursor-pointer"
                  @click="updatePayment"
                >
                  Simpan Status Pembayaran
                </button>
              </template>
            </div>
          </div>

          <!-- Bukti Pembayaran dari Pelanggan -->
          <div v-if="selectedOrder.payment" class="p-4 rounded-2xl border border-pink-200 bg-[#FFF5F8]/60 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h4 class="font-bold text-xs text-[#9D174D] flex items-center gap-1.5">
                <ImageIcon class="w-4 h-4 text-[#EC4899]" />
                Bukti Pembayaran Pelanggan
              </h4>
              <a
                v-if="selectedOrder.payment.proofUrl"
                :href="selectedOrder.payment.proofUrl"
                :download="`bukti-${selectedOrder.orderNumber}.jpg`"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-pink-200 text-[#9D174D] text-[11px] font-bold hover:bg-pink-50"
              >
                <Download class="w-3.5 h-3.5" />
                Unduh
              </a>
            </div>

            <div v-if="selectedOrder.payment.proofUrl" class="flex flex-col sm:flex-row items-start gap-4">
              <button
                type="button"
                class="w-full sm:w-44 h-36 rounded-xl overflow-hidden border border-pink-200 bg-white shrink-0 cursor-zoom-in"
                @click="proofModalUrl = selectedOrder.payment.proofUrl"
              >
                <img
                  :src="selectedOrder.payment.proofUrl"
                  :alt="`Bukti pembayaran ${selectedOrder.orderNumber}`"
                  class="w-full h-full object-cover"
                >
              </button>
              <div class="text-xs space-y-1.5 text-stone-600">
                <p class="font-bold text-emerald-700">Bukti pembayaran sudah diunggah oleh pelanggan.</p>
                <p v-if="selectedOrder.payment.referenceCode">
                  <strong>Catatan / Pengirim:</strong> {{ selectedOrder.payment.referenceCode }}
                </p>
                <p>Klik foto di samping untuk melihat ukuran penuh sebelum mengubah status pembayaran menjadi <strong>Lunas</strong>.</p>
              </div>
            </div>
            <p v-else class="text-xs text-stone-500">
              Pelanggan belum mengunggah foto bukti pembayaran.
            </p>
          </div>

          <!-- Customer Info -->
          <div class="p-4 rounded-2xl border border-stone-200 text-xs space-y-1.5">
            <p><strong>Pelanggan:</strong> {{ selectedOrder.customerName }} ({{ selectedOrder.customerWhatsapp }})</p>
            <p><strong>Pengambilan:</strong> {{ ORDER_TYPE_LABELS[selectedOrder.orderType] }}</p>
            <p v-if="selectedOrder.deliveryAddress"><strong>Alamat:</strong> {{ selectedOrder.deliveryAddress }}</p>
            <p v-if="selectedOrder.tableNumber"><strong>No. Meja:</strong> {{ selectedOrder.tableNumber }}</p>
            <p v-if="selectedOrder.notes"><strong>Catatan:</strong> {{ selectedOrder.notes }}</p>
          </div>

          <!-- Items -->
          <div class="space-y-2">
            <h4 class="font-bold text-sm text-[#292524]">Daftar Produk</h4>
            <div class="divide-y divide-stone-100 border border-stone-200 rounded-2xl px-4">
              <div v-for="item in selectedOrder.items" :key="item.id" class="py-3 flex justify-between gap-3 text-xs">
                <div>
                  <p class="font-bold text-stone-800">{{ item.quantity }}x {{ item.productName }}</p>
                  <p v-if="item.spicyLevel" class="text-stone-500">Pedas: {{ item.spicyLevel }}</p>
                  <p v-if="item.extraSambal" class="text-stone-500">Sambal: {{ item.extraSambal }}</p>
                  <p v-if="item.itemNotes" class="italic text-stone-400">"{{ item.itemNotes }}"</p>
                </div>
                <span class="font-bold text-[#9D174D]">{{ formatRupiah(item.lineTotal) }}</span>
              </div>
            </div>
            <div class="text-right text-sm font-extrabold text-[#292524] pt-1">
              Total: {{ formatRupiah(selectedOrder.totalAmount) }}
            </div>
          </div>

          <!-- Status History -->
          <div class="space-y-2">
            <h4 class="font-bold text-sm text-[#292524]">Riwayat Perubahan Status</h4>
            <div class="space-y-2 text-xs">
              <div v-for="h in selectedOrder.statusHistories" :key="h.id" class="p-3 rounded-xl bg-stone-50 flex justify-between gap-2">
                <div>
                  <p class="font-bold text-stone-800">{{ ORDER_STATUS_META[h.toStatus]?.label }}</p>
                  <p v-if="h.note" class="text-stone-500">{{ h.note }}</p>
                </div>
                <span class="text-stone-400 whitespace-nowrap">{{ formatDateJakarta(h.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zoom Lightbox for Payment Proof -->
    <div
      v-if="proofModalUrl"
      class="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
      @click.self="proofModalUrl = null"
    >
      <div class="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div class="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
          <span class="font-bold text-sm text-[#292524]">Pratinjau Bukti Pembayaran</span>
          <button type="button" class="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer" @click="proofModalUrl = null">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-4 bg-stone-50 flex justify-center">
          <img :src="proofModalUrl" alt="Bukti Pembayaran" class="max-h-[78vh] object-contain rounded-xl">
        </div>
      </div>
    </div>
  </div>
</template>
