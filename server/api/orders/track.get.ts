import { prisma } from '../../utils/prisma'
import { getSessionUser } from '../../utils/auth'
import { serializeOrder } from '../../utils/serializers'
import { normalizeWhatsappNumber } from '../../../shared/utils/format'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderNumber = typeof query.orderNumber === 'string' ? query.orderNumber.trim().toUpperCase() : undefined
  const whatsapp = typeof query.whatsapp === 'string' ? query.whatsapp.trim() : undefined

  if (orderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payment: true,
        statusHistories: { orderBy: { createdAt: 'asc' } }
      }
    })
    return {
      data: order ? [serializeOrder(order)] : []
    }
  }

  if (whatsapp) {
    const normalized = normalizeWhatsappNumber(whatsapp)
    const orders = await prisma.order.findMany({
      where: { customerWhatsapp: normalized },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: true,
        payment: true,
        statusHistories: { orderBy: { createdAt: 'asc' } }
      }
    })
    return {
      data: orders.map(serializeOrder)
    }
  }

  const user = await getSessionUser(event)
  if (!user) {
    return { data: [] }
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: user.id },
        ...(user.phone ? [{ customerWhatsapp: normalizeWhatsappNumber(user.phone) }] : [])
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: {
      items: true,
      payment: true,
      statusHistories: { orderBy: { createdAt: 'asc' } }
    }
  })

  return {
    data: orders.map(serializeOrder)
  }
})
