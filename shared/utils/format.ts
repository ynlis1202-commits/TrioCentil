import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../types'

export function formatRupiah(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0)
  if (Number.isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

export function formatDateJakarta(dateInput: string | Date | null | undefined, includeTime = true): string {
  if (!dateInput) return '-'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      : {})
  }

  return new Intl.DateTimeFormat('id-ID', options).format(date) + (includeTime ? ' WIB' : '')
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; color: string; bgClass: string; textClass: string; stepIndex: number }
> = {
  PENDING_CONFIRMATION: {
    label: 'Menunggu Konfirmasi',
    description: 'Pesanan telah diterima sistem dan menunggu konfirmasi dari dapur Warung Makan TrioCentil.',
    color: 'warning',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    stepIndex: 0
  },
  CONFIRMED: {
    label: 'Dikonfirmasi',
    description: 'Pesanan sudah dikonfirmasi dan masuk antrean dapur.',
    color: 'info',
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-800',
    stepIndex: 1
  },
  COOKING: {
    label: 'Sedang Dimasak',
    description: 'Sate ayam sedang dibakar hangat dengan bumbu kacang khas TrioCentil.',
    color: 'primary',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-800',
    stepIndex: 2
  },
  READY_FOR_PICKUP: {
    label: 'Siap Diambil',
    description: 'Pesanan telah siap disajikan atau diambil di kasir Warung Makan TrioCentil.',
    color: 'secondary',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-800',
    stepIndex: 3
  },
  OUT_FOR_DELIVERY: {
    label: 'Sedang Diantar',
    description: 'Kurir kami sedang menuju ke alamat pengiriman Anda.',
    color: 'info',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-800',
    stepIndex: 3
  },
  COMPLETED: {
    label: 'Selesai',
    description: 'Pesanan telah selesai. Terima kasih telah memesan di Warung Makan TrioCentil!',
    color: 'success',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    stepIndex: 4
  },
  CANCELLED: {
    label: 'Dibatalkan',
    description: 'Pesanan ini telah dibatalkan.',
    color: 'error',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    stepIndex: -1
  }
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DINE_IN: 'Makan di Tempat',
  TAKEAWAY: 'Ambil Sendiri',
  DELIVERY: 'Pesan Antar'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tunai saat Pesanan Diterima',
  BANK_TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS'
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; bgClass: string; textClass: string }> = {
  PENDING: { label: 'Menunggu Pembayaran', bgClass: 'bg-amber-100', textClass: 'text-amber-800' },
  PAID: { label: 'Lunas', bgClass: 'bg-emerald-100', textClass: 'text-emerald-800' },
  FAILED: { label: 'Gagal', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  REFUNDED: { label: 'Dikembalikan', bgClass: 'bg-stone-200', textClass: 'text-stone-700' }
}

export function normalizeWhatsappNumber(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`
  }
  if (digits.startsWith('8')) {
    return `62${digits}`
  }
  return digits
}
