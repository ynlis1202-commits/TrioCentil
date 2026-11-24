import type { DiscountType, OrderType } from '@prisma/client'

export interface PricedItemInput {
  basePrice: number
  quantity: number
  extraSambalPrice: number
  variantsPriceDelta: number
}

export interface PricedItemResult {
  unitPrice: number
  lineTotal: number
}

export interface OrderPricingInput {
  items: PricedItemInput[]
  orderType: OrderType
  baseDeliveryFee: number
  freeDeliveryMin: number
  promotion?: {
    discountType: DiscountType
    discountValue: number
    minOrderAmount: number
    maxDiscount: number | null
  } | null
}

export interface OrderPricingSummary {
  subtotal: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
}

export function calculateItemPricing(input: PricedItemInput): PricedItemResult {
  const qty = Math.max(1, Math.floor(input.quantity))
  const unitPrice = Math.max(0, Number(input.basePrice) + Number(input.extraSambalPrice || 0) + Number(input.variantsPriceDelta || 0))
  return {
    unitPrice,
    lineTotal: unitPrice * qty
  }
}

export function calculatePromoDiscount(
  subtotal: number,
  promotion?: {
    discountType: DiscountType
    discountValue: number
    minOrderAmount: number
    maxDiscount: number | null
  } | null
): number {
  if (!promotion) return 0
  if (subtotal < Number(promotion.minOrderAmount)) return 0

  let discount = 0
  if (promotion.discountType === 'PERCENTAGE') {
    discount = Math.round((subtotal * Number(promotion.discountValue)) / 100)
    if (promotion.maxDiscount !== null && promotion.maxDiscount !== undefined) {
      discount = Math.min(discount, Number(promotion.maxDiscount))
    }
  } else {
    discount = Number(promotion.discountValue)
  }

  return Math.max(0, Math.min(discount, subtotal))
}

export function calculateOrderTotals(input: OrderPricingInput): OrderPricingSummary {
  const subtotal = input.items.reduce((sum, item) => sum + calculateItemPricing(item).lineTotal, 0)

  let deliveryFee = 0
  if (input.orderType === 'DELIVERY') {
    if (input.freeDeliveryMin > 0 && subtotal >= input.freeDeliveryMin) {
      deliveryFee = 0
    } else {
      deliveryFee = Math.max(0, Number(input.baseDeliveryFee))
    }
  }

  const discountAmount = calculatePromoDiscount(subtotal, input.promotion)
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount)

  return {
    subtotal,
    deliveryFee,
    discountAmount,
    totalAmount
  }
}

export function generateOrderNumber(date = new Date()): string {
  const jakartaParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
    .format(date)
    .replace(/-/g, '')

  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `TC-${jakartaParts}-${randomSuffix}`
}
