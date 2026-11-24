import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { calculatePromoDiscount } from '../../utils/pricing'
import { formatRupiah } from '../../../shared/utils/format'

const validateSchema = z.object({
  code: z.string().trim().min(1, 'Kode promo wajib diisi').transform((v) => v.toUpperCase()),
  subtotal: z.coerce.number().min(0)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input promo tidak valid.'
    })
  }

  const now = new Date()
  const promo = await prisma.promotion.findUnique({
    where: { code: parsed.data.code }
  })

  if (!promo || !promo.isActive || promo.startDate > now || promo.endDate < now) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Kode promo tidak ditemukan atau sudah tidak berlaku.'
    })
  }

  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kuota penggunaan kode promo ini sudah habis.'
    })
  }

  const minOrder = Number(promo.minOrderAmount)
  if (parsed.data.subtotal < minOrder) {
    throw createError({
      statusCode: 400,
      statusMessage: `Minimal belanja untuk promo ${promo.code} adalah ${formatRupiah(minOrder)}.`
    })
  }

  const discountAmount = calculatePromoDiscount(parsed.data.subtotal, {
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    minOrderAmount: minOrder,
    maxDiscount: promo.maxDiscount !== null ? Number(promo.maxDiscount) : null
  })

  return {
    data: {
      id: promo.id,
      code: promo.code,
      title: promo.title,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount
    }
  }
})
