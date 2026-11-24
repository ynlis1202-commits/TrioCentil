import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { products: true }
      }
    }
  })

  return {
    data: categories.map((cat) => ({
      ...cat,
      productCount: cat._count.products
    }))
  }
})
