<script setup lang="ts">
import {
  MessageCircle,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  Phone,
  Clock,
  Info,
  CreditCard,
  QrCode,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  X,
  Receipt,
  Printer,
  ShieldCheck,
  AlertCircle
} from 'lucide-vue-next'
import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '~~/shared/types'
import {
  formatRupiah,
  formatDateJakarta,
  ORDER_STATUS_META,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META
} from '~~/shared/utils/format'

const route = useRoute()
const toast = useToast()
const orderNumber = computed(() => String(route.params.orderNumber || ''))
const isNewlyCreated = computed(() => route.query.created === '1')

useHead({
  title: computed(() => `Pesanan ${orderNumber.value}`)
})

interface OrderDetailResponse {
  data: {
    order: {
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
      promoCode: string | null
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
        qrisPayload: string | null
        paidAt: string | null
      } | null
      statusHistories: Array<{
        id: string
        toStatus: OrderStatus
        note: string | null
        createdAt: string
      }>
    }
    whatsappUrl: string
    whatsappMessage: string
    paymentInfo: {
      bankName: string
      bankAccountNumber: string
      bankAccountHolder: string
      qrisEnabled: boolean
      qrisMerchantName: string
    }
  }
}

const {
  data: res,
  pending,
  error,
  refresh
} = await useFetch<OrderDetailResponse>(() => `/api/orders/${orderNumber.value}`)

const order = computed(() => res.value?.data.order)
const whatsappUrl = computed(() => res.value?.data.whatsappUrl || '')
const paymentInfo = computed(() => res.value?.data.paymentInfo)
const copiedRek = ref(false)
const refreshing = ref(false)
const uploadingProof = ref(false)
const senderNote = ref('')
const previewProofFile = ref<File | null>(null)
const previewProofUrl = ref<string | null>(null)
const proofZoomOpen = ref(false)
const receiptOpen = ref(false)

async function compressImageIfNeeded(file: File): Promise<Blob> {
  if (!import.meta.client) return file
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const maxDim = 1200
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.82
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }
    img.src = objectUrl
  })
}

function handleProofFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    toast.add({
      title: 'File terlalu besar',
      description: 'Maksimal ukuran gambar 10 MB.',
      color: 'error'
    })
    return
  }
  previewProofFile.value = file
  previewProofUrl.value = URL.createObjectURL(file)
}

async function submitPaymentProof() {
  if (!previewProofFile.value || !order.value) return
  uploadingProof.value = true
  try {
    const compressed = await compressImageIfNeeded(previewProofFile.value)
    const fd = new FormData()
    fd.append('file', compressed, 'bukti-pembayaran.jpg')
    if (senderNote.value.trim()) {
      fd.append('senderNote', senderNote.value.trim())
    }

    await $fetch(`/api/orders/${order.value.orderNumber}/payment-proof`, {
      method: 'POST',
      body: fd
    })

    previewProofFile.value = null
    previewProofUrl.value = null
    senderNote.value = ''
    await refresh()
    toast.add({
      title: 'Bukti Pembayaran Terkirim!',
      description: 'Kasir Warung Makan TrioCentil akan segera memverifikasi pembayaran Anda.',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Gagal Mengunggah Bukti',
      description: err?.data?.statusMessage || 'Pastikan format gambar JPG/PNG/WEBP.',
      color: 'error'
    })
  } finally {
    uploadingProof.value = false
  }
}

async function manualRefresh() {
  refreshing.value = true
  try {
    await refresh()
    toast.add({ title: 'Status pesanan diperbarui', color: 'primary' })
  } finally {
    refreshing.value = false
  }
}

async function copyAccountNumber() {
  if (import.meta.client && paymentInfo.value?.bankAccountNumber) {
    await navigator.clipboard.writeText(paymentInfo.value.bankAccountNumber)
    copiedRek.value = true
    toast.add({ title: 'Nomor rekening disalin!', color: 'success' })
    setTimeout(() => {
      copiedRek.value = false
    }, 2500)
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <NuxtLink
        to="/pesanan"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-[#EC4899]"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Kembali ke Daftar Pesanan</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <button
          v-if="order"
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold cursor-pointer shadow-xs"
          @click="receiptOpen = true"
        >
          <Receipt class="w-3.5 h-3.5" />
          <span>Lihat Struk</span>
        </button>

        <button
          type="button"
          :disabled="refreshing"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-pink-200 text-xs font-bold text-[#9D174D] hover:bg-pink-50 cursor-pointer"
          @click="manualRefresh"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="refreshing ? 'animate-spin' : ''" />
          <span>Perbarui Status</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="h-80 rounded-3xl bg-pink-100/50 animate-pulse" />

    <div
      v-else-if="error || !order"
      class="bg-white rounded-3xl border border-pink-200 p-10 text-center space-y-3"
    >
      <h1 class="font-display font-bold text-xl text-[#9D174D]">Pesanan Tidak Ditemukan</h1>
      <p class="text-sm text-stone-500">
        Nomor pesanan <strong>{{ orderNumber }}</strong> tidak terdaftar di sistem kami.
      </p>
      <NuxtLink
        to="/pesanan"
        class="inline-flex px-5 py-2.5 rounded-full bg-[#EC4899] text-white text-sm font-bold"
      >
        Cek Nomor Lain
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Newly Created Welcome Banner -->
      <div
        v-if="isNewlyCreated"
        class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 text-emerald-900"
      >
        <p class="font-display font-bold text-base">
          Pesanan #{{ order.orderNumber }} berhasil dicatat!
        </p>
        <p class="text-xs sm:text-sm text-emerald-800 mt-1">
          Langkah berikutnya: Klik tombol <strong>Buka WhatsApp Toko</strong> di bawah agar tim Warung Makan TrioCentil segera memverifikasi dan mengonfirmasi pesanan Anda.
        </p>
      </div>

      <!-- Official Payment Validation & E-Receipt Banner -->
      <section
        v-if="order.payment?.status === 'PAID'"
        class="rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
      >
        <div class="flex items-start gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Pembayaran Tervalidasi • Lunas
            </span>
            <h2 class="font-display font-extrabold text-base sm:text-lg text-emerald-950 mt-1">
              Struk Pembayaran Resmi Tersedia
            </h2>
            <p class="text-xs text-emerald-800 mt-0.5">
              Pembayaran sebesar <strong>{{ formatRupiah(order.payment.amount) }}</strong> ({{ PAYMENT_METHOD_LABELS[order.payment.method] }}) telah diverifikasi kasir
              <span v-if="order.payment.paidAt">pada {{ formatDateJakarta(order.payment.paidAt) }}</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer transition-colors"
          @click="receiptOpen = true"
        >
          <Printer class="w-4 h-4" />
          <span>Buka & Cetak Struk</span>
        </button>
      </section>

      <section
        v-else-if="order.payment?.status === 'PENDING' && order.payment?.proofUrl"
        class="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-amber-900"
      >
        <Clock class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div class="text-xs sm:text-sm">
          <p class="font-bold">Bukti Pembayaran Diterima — Menunggu Validasi Kasir</p>
          <p class="text-amber-800 mt-0.5">
            Setelah kasir Warung Makan TrioCentil memverifikasi bukti pembayaran Anda, <strong>Struk Lunas Resmi</strong> akan otomatis muncul di halaman ini.
          </p>
        </div>
      </section>

      <section
        v-else-if="order.payment?.status === 'REFUNDED' || order.payment?.status === 'FAILED'"
        class="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-900"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div class="text-xs sm:text-sm">
          <p class="font-bold">
            Status Pembayaran: {{ PAYMENT_STATUS_META[order.payment.status].label }}
          </p>
          <p class="text-rose-800 mt-0.5">
            {{
              order.payment.status === 'REFUNDED'
                ? 'Dana pembayaran untuk pesanan ini telah dikembalikan oleh kasir Warung Makan TrioCentil.'
                : 'Pembayaran belum berhasil diverifikasi. Silakan unggah ulang bukti pembayaran yang valid atau hubungi WhatsApp kami.'
            }}
          </p>
        </div>
      </section>

      <!-- Order Header & Timeline Card -->
      <section class="bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-pink-100">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-stone-400">Nomor Pesanan</span>
            <h1 class="font-mono font-extrabold text-2xl sm:text-3xl text-[#9D174D] mt-0.5">
              {{ order.orderNumber }}
            </h1>
            <p class="text-xs text-stone-500 mt-1">
              Dipesan pada {{ formatDateJakarta(order.createdAt) }}
            </p>
          </div>
          <div class="flex flex-col sm:items-end gap-1.5">
            <OrderStatusBadge :status="order.status" />
            <p class="text-xs text-stone-500 sm:text-right max-w-xs">
              {{ ORDER_STATUS_META[order.status]?.description }}
            </p>
          </div>
        </div>

        <OrderStatusTimeline :status="order.status" :order-type="order.orderType" />
      </section>

      <!-- PROMINENT UPLOAD BUKTI PEMBAYARAN CARD (visible right above the fold!) -->
      <section
        v-if="order.payment && order.status !== 'CANCELLED' && order.payment.status !== 'PAID'"
        class="rounded-3xl bg-white border-2 border-pink-200 p-6 sm:p-7 shadow-sm space-y-4"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="font-display font-extrabold text-base sm:text-lg text-[#9D174D] flex items-center gap-2">
              <Upload class="w-5 h-5 text-[#EC4899]" />
              Unggah Bukti Pembayaran ({{ PAYMENT_METHOD_LABELS[order.payment.method] }})
            </h2>
            <p class="text-xs text-stone-500 mt-0.5">
              Total tagihan: <strong class="text-[#292524]">{{ formatRupiah(order.totalAmount) }}</strong> — Unggah foto bukti transfer/QRIS agar kasir segera memvalidasi & menerbitkan Struk Lunas.
            </p>
          </div>
          <span
            v-if="order.payment.proofUrl"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold self-start"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            Bukti Sudah Terkirim
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <!-- Uploaded / Preview Thumbnail -->
          <div v-if="previewProofUrl || order.payment.proofUrl" class="md:col-span-5">
            <div class="relative rounded-2xl overflow-hidden border border-pink-200 bg-[#FFF5F8]">
              <button
                type="button"
                class="block w-full cursor-zoom-in"
                @click="!previewProofUrl && (proofZoomOpen = true)"
              >
                <img
                  :src="previewProofUrl || order.payment.proofUrl || ''"
                  alt="Bukti Pembayaran"
                  class="w-full max-h-52 object-contain"
                >
              </button>
              <button
                v-if="previewProofUrl"
                type="button"
                class="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                @click="previewProofFile = null; previewProofUrl = null"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <p v-if="order.payment.referenceCode && !previewProofUrl" class="text-[11px] text-emerald-800 mt-1.5">
              <strong>Catatan/Pengirim:</strong> {{ order.payment.referenceCode }}
            </p>
          </div>

          <!-- Upload Form Controls -->
          <div :class="(previewProofUrl || order.payment.proofUrl) ? 'md:col-span-7' : 'md:col-span-12'" class="space-y-3">
            <div
              v-if="order.payment.method === 'BANK_TRANSFER' && paymentInfo"
              class="p-3.5 rounded-2xl bg-[#FFF5F8] border border-pink-200 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div>
                <p class="font-bold text-[#9D174D]">{{ paymentInfo.bankName }} • a.n. {{ paymentInfo.bankAccountHolder }}</p>
                <code class="text-sm font-extrabold text-[#292524]">{{ paymentInfo.bankAccountNumber }}</code>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-[#9D174D] font-bold cursor-pointer"
                @click="copyAccountNumber"
              >
                <Check v-if="copiedRek" class="w-3.5 h-3.5 text-emerald-600" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedRek ? 'Tersalin' : 'Salin No. Rek' }}</span>
              </button>
            </div>

            <input
              v-model="senderNote"
              type="text"
              maxlength="100"
              placeholder="Nama pengirim / catatan transfer (opsional)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-xs sm:text-sm"
            >

            <div class="flex flex-wrap gap-2.5">
              <label class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFF5F8] hover:bg-pink-100 border border-pink-200 text-[#9D174D] text-xs sm:text-sm font-bold cursor-pointer transition-colors">
                <Upload class="w-4 h-4 text-[#EC4899]" />
                <span>{{ order.payment.proofUrl ? 'Ganti Foto Bukti Bayar' : 'Pilih Foto Bukti Pembayaran' }}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="handleProofFileChange"
                >
              </label>

              <button
                v-if="previewProofFile"
                type="button"
                :disabled="uploadingProof"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-60 text-white text-xs sm:text-sm font-bold cursor-pointer shadow-sm transition-colors"
                @click="submitPaymentProof"
              >
                <Loader2 v-if="uploadingProof" class="w-4 h-4 animate-spin" />
                <span>{{ uploadingProof ? 'Mengirim Bukti...' : 'Kirim Bukti Pembayaran' }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- WhatsApp Order Integration Card -->
      <section class="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-6 sm:p-8 shadow-md space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <h2 class="font-display font-extrabold text-lg sm:text-xl flex items-center gap-2">
              <MessageCircle class="w-6 h-6" />
              Kirim & Konfirmasi via WhatsApp
            </h2>
            <p class="text-xs sm:text-sm text-emerald-50/90 max-w-xl">
              Klik tombol di samping untuk membuka WhatsApp dengan detail pesanan otomatis (nomor pesanan, daftar menu, total, dan alamat).
            </p>
          </div>

          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm shadow-lg transition-all active:scale-95"
          >
            <MessageCircle class="w-5 h-5" />
            <span>Buka WhatsApp Toko</span>
          </a>
        </div>

        <div class="flex items-start gap-2.5 p-3.5 rounded-xl bg-black/15 text-xs text-emerald-50">
          <Info class="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Penting:</strong> Membuka WhatsApp tidak otomatis mengubah status menjadi <em>Dikonfirmasi</em>. Pesanan akan dikonfirmasi secara resmi oleh kasir Warung Makan TrioCentil dan statusnya dapat Anda pantau langsung di halaman ini.
          </span>
        </div>
      </section>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Items Breakdown -->
        <section class="lg:col-span-7 bg-white rounded-3xl border border-pink-100 p-6 shadow-xs space-y-4">
          <h2 class="font-display font-bold text-lg text-[#292524]">Rincian Menu</h2>

          <div class="divide-y divide-pink-50">
            <div v-for="item in order.items" :key="item.id" class="py-3.5 flex items-start justify-between gap-3">
              <div>
                <p class="font-bold text-sm text-[#292524]">
                  {{ item.quantity }}x {{ item.productName }}
                </p>
                <div class="text-xs text-stone-500 space-y-0.5 mt-1">
                  <p v-if="item.spicyLevel">Tingkat Pedas: {{ item.spicyLevel }}</p>
                  <p v-if="item.extraSambal && item.extraSambal !== 'Tanpa Tambahan'">
                    Tambahan: {{ item.extraSambal }}
                  </p>
                  <p v-if="item.itemNotes" class="italic">Catatan: "{{ item.itemNotes }}"</p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs text-stone-400">{{ formatRupiah(item.unitPrice) }}</p>
                <p class="font-bold text-sm text-[#9D174D]">{{ formatRupiah(item.lineTotal) }}</p>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-pink-100 space-y-2 text-sm">
            <div class="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{{ formatRupiah(order.subtotal) }}</span>
            </div>
            <div v-if="order.deliveryFee > 0" class="flex justify-between text-stone-600">
              <span>Ongkos Kirim</span>
              <span>{{ formatRupiah(order.deliveryFee) }}</span>
            </div>
            <div v-if="order.discountAmount > 0" class="flex justify-between text-emerald-700">
              <span>Diskon {{ order.promoCode ? `(${order.promoCode})` : '' }}</span>
              <span>-{{ formatRupiah(order.discountAmount) }}</span>
            </div>
            <div class="flex justify-between items-baseline pt-3 border-t border-pink-100">
              <span class="font-display font-bold text-base text-[#292524]">Total Pembayaran</span>
              <span class="font-display font-extrabold text-xl text-[#9D174D]">
                {{ formatRupiah(order.totalAmount) }}
              </span>
            </div>
          </div>
        </section>

        <!-- Customer, Payment & History -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Payment Box -->
          <section v-if="order.payment" class="bg-white rounded-3xl border border-pink-100 p-6 shadow-xs space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-display font-bold text-base text-[#292524] flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-[#EC4899]" />
                Pembayaran
              </h2>
              <span
                class="px-2.5 py-1 rounded-full text-[11px] font-bold"
                :class="[
                  PAYMENT_STATUS_META[order.payment.status].bgClass,
                  PAYMENT_STATUS_META[order.payment.status].textClass
                ]"
              >
                {{ PAYMENT_STATUS_META[order.payment.status].label }}
              </span>
            </div>

            <p class="text-sm font-semibold text-stone-700">
              {{ PAYMENT_METHOD_LABELS[order.payment.method] }}
            </p>

            <!-- Bank Transfer Info -->
            <div
              v-if="order.payment.method === 'BANK_TRANSFER' && paymentInfo"
              class="p-4 rounded-2xl bg-[#FFF5F8] border border-pink-200 space-y-2 text-xs"
            >
              <p class="font-bold text-[#9D174D]">{{ paymentInfo.bankName }}</p>
              <div class="flex items-center justify-between gap-2">
                <code class="text-base font-extrabold text-[#292524]">
                  {{ paymentInfo.bankAccountNumber }}
                </code>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-pink-200 text-[#9D174D] font-bold cursor-pointer"
                  @click="copyAccountNumber"
                >
                  <Check v-if="copiedRek" class="w-3.5 h-3.5 text-emerald-600" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedRek ? 'Tersalin' : 'Salin' }}</span>
                </button>
              </div>
              <p class="text-stone-600">a.n. {{ paymentInfo.bankAccountHolder }}</p>
              <p class="text-stone-500 pt-1">
                Kirim bukti transfer melalui chat WhatsApp toko agar kasir dapat segera memverifikasi.
              </p>
            </div>

            <!-- QRIS Info -->
            <div
              v-if="order.payment.method === 'QRIS' && paymentInfo"
              class="p-4 rounded-2xl bg-[#FFF5F8] border border-pink-200 text-center space-y-2 text-xs"
            >
              <div class="w-24 h-24 rounded-2xl bg-white border border-pink-200 flex items-center justify-center mx-auto">
                <QrCode class="w-16 h-16 text-[#292524]" />
              </div>
              <p class="font-bold text-[#9D174D]">{{ paymentInfo.qrisMerchantName }}</p>
              <p class="text-stone-600">
                Nominal: <strong>{{ formatRupiah(order.totalAmount) }}</strong>
              </p>
              <p class="text-stone-500">
                Scan kode QRIS di kasir atau unggah bukti bayar QRIS di bawah ini.
              </p>
            </div>

            <!-- Uploaded Proof Summary inside Payment Box (when PAID) -->
            <div
              v-if="order.payment.proofUrl && order.payment.status === 'PAID'"
              class="pt-3 border-t border-pink-100 space-y-2"
            >
              <p class="text-xs font-bold text-[#9D174D] flex items-center gap-1.5">
                <ImageIcon class="w-4 h-4 text-[#EC4899]" />
                Bukti Pembayaran Terverifikasi
              </p>
              <button
                type="button"
                class="block w-full rounded-xl overflow-hidden border border-emerald-200 bg-white cursor-zoom-in"
                @click="proofZoomOpen = true"
              >
                <img
                  :src="order.payment.proofUrl"
                  alt="Bukti Pembayaran"
                  class="w-full max-h-48 object-contain bg-stone-50"
                >
              </button>
            </div>
          </section>

          <!-- Customer Info -->
          <section class="bg-white rounded-3xl border border-pink-100 p-6 shadow-xs space-y-3 text-sm">
            <h2 class="font-display font-bold text-base text-[#292524]">Informasi Pengambilan</h2>
            <p class="font-bold text-[#9D174D]">{{ ORDER_TYPE_LABELS[order.orderType] }}</p>
            <div class="space-y-2 text-xs text-stone-600">
              <p><strong>Pemesan:</strong> {{ order.customerName }}</p>
              <p class="flex items-center gap-1.5">
                <Phone class="w-3.5 h-3.5 text-[#EC4899]" />
                <span>{{ order.customerWhatsapp }}</span>
              </p>
              <p v-if="order.deliveryAddress" class="flex items-start gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-[#E11D48] shrink-0 mt-0.5" />
                <span>{{ order.deliveryAddress }}</span>
              </p>
              <p v-if="order.tableNumber"><strong>Nomor Meja:</strong> {{ order.tableNumber }}</p>
              <p v-if="order.notes"><strong>Catatan:</strong> {{ order.notes }}</p>
            </div>
          </section>

          <!-- Audit Status History -->
          <section class="bg-white rounded-3xl border border-pink-100 p-6 shadow-xs space-y-3">
            <h2 class="font-display font-bold text-base text-[#292524] flex items-center gap-2">
              <Clock class="w-4 h-4 text-[#EC4899]" />
              Riwayat Status
            </h2>
            <ol class="space-y-3 border-l-2 border-pink-200 pl-4 ml-1">
              <li v-for="hist in order.statusHistories" :key="hist.id" class="relative text-xs">
                <span class="w-2.5 h-2.5 rounded-full bg-[#EC4899] absolute -left-[21px] top-1" />
                <p class="font-bold text-[#292524]">
                  {{ ORDER_STATUS_META[hist.toStatus]?.label || hist.toStatus }}
                </p>
                <p v-if="hist.note" class="text-stone-600 mt-0.5">{{ hist.note }}</p>
                <p class="text-[11px] text-stone-400 mt-0.5">{{ formatDateJakarta(hist.createdAt) }}</p>
              </li>
            </ol>
          </section>
        </div>
      </div>

      <!-- Fullscreen Lightbox for Uploaded Proof -->
      <div
        v-if="proofZoomOpen && order.payment?.proofUrl"
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        @click.self="proofZoomOpen = false"
      >
        <div class="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div class="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <span class="font-bold text-sm text-[#292524]">Bukti Pembayaran #{{ order.orderNumber }}</span>
            <button type="button" class="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer" @click="proofZoomOpen = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-4 bg-stone-50 flex justify-center">
            <img :src="order.payment.proofUrl" alt="Bukti Pembayaran" class="max-h-[75vh] object-contain rounded-xl">
          </div>
        </div>
      </div>
      <!-- Official Digital Receipt Modal -->
      <OrderReceiptModal :open="receiptOpen" :order="order" @close="receiptOpen = false" />
    </template>
  </div>
</template>
