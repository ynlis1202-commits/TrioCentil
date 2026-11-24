import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return {
    data: promotions.map((p) => ({
      ...p,
      discountValue: Number(p.discountValue),
      minOrderAmount: Number(p.minOrderAmount),
      maxDiscount: p.maxDiscount !== null ? Number(p.maxDiscount) : null,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString()
    }))
  }
})
