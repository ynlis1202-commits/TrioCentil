import { describe, it, expect } from 'vitest'
import { createOrderSchema, promotionUpsertSchema } from '../server/utils/validation'

describe('Zod Request Validation', () => {
  const validItem = {
    productId: '550e8400-e29b-41d4-a716-446655440000',
    quantity: 2,
    spicyLevel: 'Pedas'
  }

  it('menolak checkout DELIVERY jika alamat pengiriman kosong', () => {
    const res = createOrderSchema.safeParse({
      customerName: 'Budi',
      customerWhatsapp: '081234567890',
      orderType: 'DELIVERY',
      deliveryAddress: '',
      paymentMethod: 'CASH',
      items: [validItem]
    })
    expect(res.success).toBe(false)
  })

  it('menerima checkout TAKEAWAY tanpa alamat pengiriman', () => {
    const res = createOrderSchema.safeParse({
      customerName: 'Siti Rahma',
      customerWhatsapp: '081234567890',
      orderType: 'TAKEAWAY',
      paymentMethod: 'BANK_TRANSFER',
      items: [validItem]
    })
    expect(res.success).toBe(true)
  })

  it('mengubah kode promo menjadi huruf besar otomatis', () => {
    const res = promotionUpsertSchema.safeParse({
      code: 'hemat10',
      title: 'Diskon 10%',
      description: 'Diskon spesial untuk semua pelanggan',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 30000,
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.code).toBe('HEMAT10')
    }
  })
})
