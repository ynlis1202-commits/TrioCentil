import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter')
})

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
  email: z.string().trim().email('Format email tidak valid').max(160),
  phone: z
    .string()
    .trim()
    .min(9, 'Nomor WhatsApp minimal 9 digit')
    .max(20, 'Nomor WhatsApp terlalu panjang'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter').max(100)
})

export const checkoutItemSchema = z.object({
  productId: z.string().uuid('ID produk tidak valid'),
  quantity: z.number().int().min(1, 'Jumlah minimal 1').max(50, 'Jumlah maksimal 50 per item'),
  spicyLevel: z.string().trim().max(50).optional().nullable(),
  extraSambalName: z.string().trim().max(120).optional().nullable(),
  variantIds: z.array(z.string().uuid()).optional().default([]),
  itemNotes: z.string().trim().max(300).optional().nullable()
})

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(2, 'Nama pelanggan wajib diisi').max(120),
    customerWhatsapp: z
      .string()
      .trim()
      .min(9, 'Nomor WhatsApp tidak valid')
      .max(25, 'Nomor WhatsApp terlalu panjang'),
    orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
    deliveryAddress: z.string().trim().max(500).optional().nullable(),
    tableNumber: z.string().trim().max(20).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'QRIS']),
    promoCode: z.string().trim().max(50).optional().nullable(),
    items: z.array(checkoutItemSchema).min(1, 'Keranjang belanja masih kosong')
  })
  .superRefine((data, ctx) => {
    if (data.orderType === 'DELIVERY' && (!data.deliveryAddress || data.deliveryAddress.trim().length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveryAddress'],
        message: 'Alamat pengiriman lengkap wajib diisi untuk Pesan Antar (minimal 10 karakter)'
      })
    }
  })

export const productUpsertSchema = z.object({
  categoryId: z.string().uuid('Kategori wajib dipilih'),
  name: z.string().trim().min(2, 'Nama produk minimal 2 karakter').max(150),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
    .optional(),
  shortDescription: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().min(5, 'Deskripsi produk wajib diisi'),
  price: z.coerce.number().min(500, 'Harga minimal Rp 500'),
  comparePrice: z.coerce.number().min(0).optional().nullable(),
  sku: z.string().trim().max(60).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(100),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  preparationTime: z.coerce.number().int().min(1).max(180).default(15),
  imageUrl: z.string().trim().optional().nullable(),
  spicyOptions: z.array(z.string().trim().min(1)).optional().default([]),
  extraSambalOptions: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        price: z.coerce.number().min(0)
      })
    )
    .optional()
    .default([])
})

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori wajib diisi').max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().max(60).optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
})

export const promotionUpsertSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Kode promo minimal 3 karakter')
    .max(50)
    .transform((v) => v.toUpperCase()),
  title: z.string().trim().min(3, 'Judul promo wajib diisi').max(140),
  description: z.string().trim().min(5, 'Deskripsi promo wajib diisi'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.coerce.number().positive('Nilai diskon harus lebih dari 0'),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
  badgeText: z.string().trim().max(50).optional().nullable()
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'COOKING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED'
  ]),
  note: z.string().trim().max(300).optional().nullable()
})

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  referenceCode: z.string().trim().max(100).optional().nullable()
})

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
