import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { promotionUpsertSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID promo tidak valid.' })

  const body = await readBody(event)
  const parsed = promotionUpsertSchema.partial().safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data promo tidak valid.'
    })
  }

  const updated = await prisma.promotion.update({
    where: { id },
    data: parsed.data
  })

  return {
    data: {
      ...updated,
      discountValue: Number(updated.discountValue),
      minOrderAmount: Number(updated.minOrderAmount),
      maxDiscount: updated.maxDiscount !== null ? Number(updated.maxDiscount) : null
    }
  }
})
