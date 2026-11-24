import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const now = new Date()
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now }
    },
    orderBy: { createdAt: 'desc' }
  })

  return {
    data: promotions.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      discountType: p.discountType,
      discountValue: Number(p.discountValue),
      minOrderAmount: Number(p.minOrderAmount),
      maxDiscount: p.maxDiscount !== null ? Number(p.maxDiscount) : null,
      usageLimit: p.usageLimit,
      usedCount: p.usedCount,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      isActive: p.isActive,
      badgeText: p.badgeText
    }))
  }
})
