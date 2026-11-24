import type { OrderStatus, Prisma } from '@prisma/client'
import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { serializeOrder } from '../../../utils/serializers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const status = typeof query.status === 'string' && query.status !== 'ALL' ? (query.status as OrderStatus) : undefined
  const search = typeof query.search === 'string' ? query.search.trim() : undefined

  const where: Prisma.OrderWhereInput = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { customerName: { contains: search } },
      { customerWhatsapp: { contains: search } }
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      items: true,
      payment: true,
      statusHistories: {
        orderBy: { createdAt: 'desc' },
        include: {
          changedBy: { select: { name: true, role: true } }
        }
      }
    }
  })

  return {
    data: orders.map(serializeOrder)
  }
})
