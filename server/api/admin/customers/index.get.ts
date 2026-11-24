import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : undefined

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { whatsapp: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : undefined,
    orderBy: [{ totalSpent: 'desc' }, { createdAt: 'desc' }],
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true
        }
      }
    }
  })

  return {
    data: customers.map((c) => ({
      ...c,
      totalSpent: Number(c.totalSpent),
      orders: c.orders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount)
      }))
    }))
  }
})
