import { formatRupiah, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS, normalizeWhatsappNumber } from '../../shared/utils/format'
import type { OrderType, PaymentMethod } from '../../shared/types'

export interface WhatsappOrderItem {
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  spicyLevel?: string | null
  extraSambal?: string | null
  itemNotes?: string | null
}

export interface WhatsappOrderMessageInput {
  orderNumber: string
  customerName: string
  customerWhatsapp: string
  orderType: OrderType
  deliveryAddress?: string | null
  tableNumber?: string | null
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
  notes?: string | null
  items: WhatsappOrderItem[]
  trackingUrl?: string
}

export function buildWhatsappOrderMessage(input: WhatsappOrderMessageInput): string {
  const itemLines = input.items.map((item, index) => {
    const details: string[] = []
    if (item.spicyLevel) details.push(`Pedas: ${item.spicyLevel}`)
    if (item.extraSambal && item.extraSambal !== 'Tanpa Tambahan') details.push(`Sambal: ${item.extraSambal}`)
    if (item.itemNotes) details.push(`Catatan: ${item.itemNotes}`)

    const detailSuffix = details.length > 0 ? `\n   _${details.join(' | ')}_` : ''
    return `${index + 1}. ${item.productName} x${item.quantity} (${formatRupiah(item.unitPrice)}) = ${formatRupiah(item.lineTotal)}${detailSuffix}`
  })

  const lines: string[] = [
    '*PESANAN BARU - WARUNG MAKAN TRIOCENTIL*',
    '----------------------------------------',
    `No. Pesanan : *${input.orderNumber}*`,
    `Nama        : ${input.customerName}`,
    `No. WA      : ${input.customerWhatsapp}`,
    `Pengambilan : ${ORDER_TYPE_LABELS[input.orderType]}`,
    `Pembayaran  : ${PAYMENT_METHOD_LABELS[input.paymentMethod]}`
  ]

  if (input.orderType === 'DELIVERY' && input.deliveryAddress) {
    lines.push(`Alamat      : ${input.deliveryAddress}`)
  }
  if (input.orderType === 'DINE_IN' && input.tableNumber) {
    lines.push(`No. Meja    : ${input.tableNumber}`)
  }

  lines.push('----------------------------------------')
  lines.push('*Daftar Pesanan:*')
  lines.push(...itemLines)
  lines.push('----------------------------------------')
  lines.push(`Subtotal    : ${formatRupiah(input.subtotal)}`)
  if (input.deliveryFee > 0) {
    lines.push(`Ongkir      : ${formatRupiah(input.deliveryFee)}`)
  }
  if (input.discountAmount > 0) {
    lines.push(`Diskon      : -${formatRupiah(input.discountAmount)}`)
  }
  lines.push(`*TOTAL      : ${formatRupiah(input.totalAmount)}*`)

  if (input.notes) {
    lines.push('----------------------------------------')
    lines.push(`Catatan     : ${input.notes}`)
  }

  if (input.trackingUrl) {
    lines.push('----------------------------------------')
    lines.push(`Lacak Pesanan: ${input.trackingUrl}`)
  }

  lines.push('')
  lines.push('Mohon konfirmasi pesanan saya ya. Terima kasih!')

  return lines.join('\n')
}

export function buildWhatsappUrl(storeWhatsappNumber: string, message: string): string {
  const normalized = normalizeWhatsappNumber(storeWhatsappNumber)
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
