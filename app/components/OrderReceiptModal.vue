<script setup lang="ts">
import { Printer, X, CheckCircle2, Copy, Check, Receipt } from 'lucide-vue-next'
import type { OrderType, PaymentMethod, PaymentStatus } from '~~/shared/types'
import {
  formatRupiah,
  formatDateJakarta,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META
} from '~~/shared/utils/format'

export interface ReceiptOrderData {
  orderNumber: string
  customerName: string
  customerWhatsapp: string
  orderType: OrderType
  deliveryAddress?: string | null
  tableNumber?: string | null
  notes?: string | null
  subtotal: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
  promoCode?: string | null
  createdAt: string
  items: Array<{
    id: string
    productName: string
    unitPrice: number
    quantity: number
    spicyLevel?: string | null
    extraSambal?: string | null
    lineTotal: number
  }>
  payment: {
    method: PaymentMethod
    status: PaymentStatus
    amount: number
    referenceCode?: string | null
    paidAt?: string | null
  } | null
}

const props = defineProps<{
  open: boolean
  order: ReceiptOrderData | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const storefront = useStorefrontStore()
const toast = useToast()
const copied = ref(false)

const validationCode = computed(() => {
  if (!props.order) return ''
  return `VALID-${props.order.orderNumber.replace(/^TC-/, '')}`
})

function handlePrint() {
  if (import.meta.client) {
    window.print()
  }
}

async function copyReceiptText() {
  if (!props.order || !import.meta.client || !navigator.clipboard) return
  const o = props.order
  const lines = [
    '================================',
    '    WARUNG MAKAN TRIOCENTIL     ',
    storefront.settings.store_address,
    '================================',
    `No. Struk : ${validationCode.value}`,
    `No. Order : ${o.orderNumber}`,
    `Tanggal   : ${formatDateJakarta(o.createdAt)}`,
    `Pelanggan : ${o.customerName}`,
    `Layanan   : ${ORDER_TYPE_LABELS[o.orderType]}`,
    `Bayar     : ${o.payment ? PAYMENT_METHOD_LABELS[o.payment.method] : '-'}`,
    `Status    : ${o.payment ? PAYMENT_STATUS_META[o.payment.status].label.toUpperCase() : '-'}`,
    ...(o.payment?.paidAt ? [`Validasi  : ${formatDateJakarta(o.payment.paidAt)}`] : []),
    '--------------------------------',
    ...o.items.map((i) => `${i.quantity}x ${i.productName} = ${formatRupiah(i.lineTotal)}`),
    '--------------------------------',
    `Subtotal  : ${formatRupiah(o.subtotal)}`,
    ...(o.deliveryFee > 0 ? [`Ongkir    : ${formatRupiah(o.deliveryFee)}`] : []),
    ...(o.discountAmount > 0 ? [`Diskon    : -${formatRupiah(o.discountAmount)}`] : []),
    `TOTAL     : ${formatRupiah(o.totalAmount)}`,
    '================================',
    'Terima kasih telah memesan di',
    'Warung Makan TrioCentil!'
  ]
  await navigator.clipboard.writeText(lines.join('\n'))
  copied.value = true
  toast.add({ title: 'Teks struk disalin!', color: 'success' })
  setTimeout(() => {
    copied.value = false
  }, 2500)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && order"
      class="receipt-modal-root fixed inset-0 z-[70] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden my-auto">
        <!-- Modal Top Actions (hidden on print) -->
        <div class="no-print px-5 py-3.5 border-b border-pink-100 flex items-center justify-between bg-[#FFF5F8]">
          <span class="font-display font-bold text-sm text-[#9D174D] flex items-center gap-1.5">
            <Receipt class="w-4 h-4 text-[#EC4899]" />
            Struk Pembayaran Digital
          </span>
          <button
            type="button"
            class="p-1.5 rounded-lg text-stone-500 hover:bg-pink-100 cursor-pointer"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Printable Receipt Paper -->
        <div id="printable-receipt" class="p-6 space-y-4 text-xs text-[#292524] bg-white">
          <!-- Store Header -->
          <div class="text-center space-y-1 pb-4 border-b border-dashed border-stone-300">
            <div class="flex justify-center mb-1">
              <BrandLogo compact />
            </div>
            <h2 class="font-display font-extrabold text-base text-[#1F1219] tracking-tight">
              WARUNG MAKAN TRIOCENTIL
            </h2>
            <p class="text-[11px] text-stone-500 leading-snug">
              {{ storefront.settings.store_address }}
            </p>
            <p class="text-[10px] text-stone-400">
              Telp/WA: {{ storefront.settings.store_phone }}
            </p>
          </div>

          <!-- Official Validation Stamp -->
          <div
            v-if="order.payment?.status === 'PAID'"
            class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p class="font-extrabold text-xs tracking-wide uppercase">PEMBAYARAN TERVALIDASI • LUNAS</p>
                <p v-if="order.payment.paidAt" class="text-[10px] text-emerald-700">
                  Divalidasi: {{ formatDateJakarta(order.payment.paidAt) }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-else-if="order.payment"
            class="px-3.5 py-2 rounded-xl text-center font-bold text-xs"
            :class="[
              PAYMENT_STATUS_META[order.payment.status].bgClass,
              PAYMENT_STATUS_META[order.payment.status].textClass
            ]"
          >
            Status Pembayaran: {{ PAYMENT_STATUS_META[order.payment.status].label.toUpperCase() }}
          </div>

          <!-- Metadata -->
          <div class="space-y-1.5 pb-3 border-b border-dashed border-stone-300 font-mono text-[11px]">
            <div class="flex justify-between gap-2">
              <span class="text-stone-500">No. Struk</span>
              <span class="font-bold">{{ validationCode }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-stone-500">No. Pesanan</span>
              <span class="font-bold text-[#9D174D]">{{ order.orderNumber }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-stone-500">Waktu Order</span>
              <span>{{ formatDateJakarta(order.createdAt) }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-stone-500">Pelanggan</span>
              <span class="font-semibold text-right">{{ order.customerName }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-stone-500">Layanan</span>
              <span>{{ ORDER_TYPE_LABELS[order.orderType] }}{{ order.tableNumber ? ` (${order.tableNumber})` : '' }}</span>
            </div>
            <div v-if="order.payment" class="flex justify-between gap-2">
              <span class="text-stone-500">Metode Bayar</span>
              <span class="font-semibold text-right">{{ PAYMENT_METHOD_LABELS[order.payment.method] }}</span>
            </div>
            <div v-if="order.payment?.referenceCode" class="flex justify-between gap-2">
              <span class="text-stone-500">Referensi</span>
              <span class="text-right">{{ order.payment.referenceCode }}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="space-y-2 pb-3 border-b border-dashed border-stone-300">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between gap-2">
              <div class="min-w-0">
                <p class="font-bold text-[#1F1219]">{{ item.quantity }}x {{ item.productName }}</p>
                <p v-if="item.spicyLevel || (item.extraSambal && item.extraSambal !== 'Tanpa Tambahan')" class="text-[10px] text-stone-500">
                  {{ [item.spicyLevel, item.extraSambal !== 'Tanpa Tambahan' ? item.extraSambal : null].filter(Boolean).join(' • ') }}
                </p>
              </div>
              <span class="font-mono font-semibold whitespace-nowrap">
                {{ formatRupiah(item.lineTotal) }}
              </span>
            </div>
          </div>

          <!-- Totals -->
          <div class="space-y-1.5 font-mono text-[11px]">
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
            <div class="flex justify-between items-baseline pt-2 border-t border-stone-200 text-sm font-extrabold text-[#1F1219]">
              <span>TOTAL</span>
              <span class="text-[#9D174D]">{{ formatRupiah(order.totalAmount) }}</span>
            </div>
          </div>

          <!-- Footer Note -->
          <div class="pt-3 border-t border-dashed border-stone-300 text-center space-y-1 text-[10px] text-stone-500">
            <p class="font-semibold text-[#9D174D]">
              "{{ storefront.settings.store_tagline }}"
            </p>
            <p>Simpan struk digital ini sebagai bukti transaksi & pengambilan pesanan resmi.</p>
          </div>
        </div>

        <!-- Bottom Action Buttons (hidden on print) -->
        <div class="no-print px-5 py-4 bg-stone-50 border-t border-stone-100 flex gap-2.5">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-[#9D174D] hover:bg-pink-50 text-xs font-bold cursor-pointer"
            @click="copyReceiptText"
          >
            <Check v-if="copied" class="w-4 h-4 text-emerald-600" />
            <Copy v-else class="w-4 h-4" />
            <span>{{ copied ? 'Tersalin' : 'Salin Struk' }}</span>
          </button>
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold cursor-pointer shadow-xs"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
