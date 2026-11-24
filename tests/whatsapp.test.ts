import { describe, it, expect } from 'vitest'
import { buildWhatsappOrderMessage, buildWhatsappUrl } from '../server/utils/whatsapp'
import { normalizeWhatsappNumber, formatRupiah } from '../shared/utils/format'

describe('WhatsApp Order & Formatter Utilities', () => {
  it('menormalisasi nomor lokal Indonesia 08xx menjadi 628xx', () => {
    expect(normalizeWhatsappNumber('0812-3456-7890')).toBe('6281234567890')
    expect(normalizeWhatsappNumber('+62 812 9999 0000')).toBe('6281299990000')
    expect(normalizeWhatsappNumber('8123456789')).toBe('628123456789')
  })

  it('memformat mata uang Rupiah (IDR) dengan benar', () => {
    expect(formatRupiah(27000)).toContain('27.000')
    expect(formatRupiah(0)).toContain('0')
  })

  it('membuat pesan WhatsApp pesanan lengkap termasuk alamat delivery dan URL valid', () => {
    const msg = buildWhatsappOrderMessage({
      orderNumber: 'TC-20261124-1234',
      customerName: 'Budi Santoso',
      customerWhatsapp: '6281298765432',
      orderType: 'DELIVERY',
      deliveryAddress: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
      paymentMethod: 'QRIS',
      subtotal: 60000,
      deliveryFee: 10000,
      discountAmount: 5000,
      totalAmount: 65000,
      notes: 'Bumbu kacang dipisah',
      items: [
        {
          productName: 'Sate Ayam + Nasi',
          quantity: 2,
          unitPrice: 27000,
          lineTotal: 54000,
          spicyLevel: 'Pedas',
          extraSambal: 'Sambal Kacang Extra'
        },
        {
          productName: 'Es Teh Manis',
          quantity: 1,
          unitPrice: 6000,
          lineTotal: 6000
        }
      ],
      trackingUrl: 'http://localhost:3000/pesanan/TC-20261124-1234'
    })

    expect(msg).toContain('TC-20261124-1234')
    expect(msg).toContain('Budi Santoso')
    expect(msg).toContain('Sate Ayam + Nasi x2')
    expect(msg).toContain('Pedas: Pedas')
    expect(msg).toContain('Jl. Kemang Raya No. 12, Jakarta Selatan')
    expect(msg).toContain('Bumbu kacang dipisah')

    const url = buildWhatsappUrl('081234567890', msg)
    expect(url.startsWith('https://wa.me/6281234567890?text=')).toBe(true)
  })
})
