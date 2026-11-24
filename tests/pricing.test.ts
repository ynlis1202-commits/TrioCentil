import { describe, it, expect } from 'vitest'
import {
  calculateItemPricing,
  calculatePromoDiscount,
  calculateOrderTotals,
  generateOrderNumber
} from '../server/utils/pricing'

describe('Server-Side Pricing Calculation', () => {
  it('menghitung harga satuan dan subtotal item dengan sambal & varian', () => {
    const result = calculateItemPricing({
      basePrice: 27000,
      quantity: 2,
      extraSambalPrice: 3000,
      variantsPriceDelta: 10000
    })
    expect(result.unitPrice).toBe(40000)
    expect(result.lineTotal).toBe(80000)
  })

  it('menghitung diskon persentase dengan batas maksimal diskon', () => {
    const discount = calculatePromoDiscount(200000, {
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 40000,
      maxDiscount: 15000
    })
    expect(discount).toBe(15000)
  })

  it('mengembalikan diskon 0 apabila belum memenuhi minimal belanja', () => {
    const discount = calculatePromoDiscount(25000, {
      discountType: 'FIXED',
      discountValue: 5000,
      minOrderAmount: 35000,
      maxDiscount: 5000
    })
    expect(discount).toBe(0)
  })

  it('menghitung total pesanan delivery dengan ongkir dan gratis ongkir otomatis', () => {
    const withFee = calculateOrderTotals({
      items: [{ basePrice: 27000, quantity: 2, extraSambalPrice: 0, variantsPriceDelta: 0 }],
      orderType: 'DELIVERY',
      baseDeliveryFee: 10000,
      freeDeliveryMin: 75000,
      promotion: null
    })
    expect(withFee.subtotal).toBe(54000)
    expect(withFee.deliveryFee).toBe(10000)
    expect(withFee.totalAmount).toBe(64000)

    const freeFee = calculateOrderTotals({
      items: [{ basePrice: 27000, quantity: 3, extraSambalPrice: 0, variantsPriceDelta: 0 }],
      orderType: 'DELIVERY',
      baseDeliveryFee: 10000,
      freeDeliveryMin: 75000,
      promotion: {
        discountType: 'FIXED',
        discountValue: 5000,
        minOrderAmount: 35000,
        maxDiscount: 5000
      }
    })
    expect(freeFee.subtotal).toBe(81000)
    expect(freeFee.deliveryFee).toBe(0)
    expect(freeFee.discountAmount).toBe(5000)
    expect(freeFee.totalAmount).toBe(76000)
  })

  it('menghasilkan format nomor pesanan otomatis TC-YYYYMMDD-XXXX', () => {
    const num = generateOrderNumber(new Date('2026-11-24T05:00:00Z'))
    expect(num).toMatch(/^TC-20261124-\d{4}$/)
  })
})
