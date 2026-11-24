import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { promotionUpsertSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = promotionUpsertSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data promo tidak valid.'
    })
  }

  const existing = await prisma.promotion.findUnique({ where: { code: parsed.data.code } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Kode promo sudah digunakan.' })
  }

  const created = await prisma.promotion.create({
    data: parsed.data
  })

  setResponseStatus(event, 201)
  return {
    data: {
      ...created,
      discountValue: Number(created.discountValue),
      minOrderAmount: Number(created.minOrderAmount),
      maxDiscount: created.maxDiscount !== null ? Number(created.maxDiscount) : null
    }
  }
})
