import { OrderStatus } from '@prisma/client'
import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  const defaultStart = new Date(`${todayStr}T00:00:00+07:00`)
  defaultStart.setDate(defaultStart.getDate() - 29)

  const startDate =
    typeof query.startDate === 'string' && query.startDate
      ? new Date(`${query.startDate}T00:00:00+07:00`)
      : defaultStart

  const endDate =
    typeof query.endDate === 'string' && query.endDate
      ? new Date(`${query.endDate}T23:59:59+07:00`)
      : new Date(`${todayStr}T23:59:59+07:00`)

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      items: true,
      payment: true
    },
    orderBy: { createdAt: 'asc' }
  })

  const validOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED)
  const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED)
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED)

  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const totalDiscount = validOrders.reduce((sum, o) => sum + Number(o.discountAmount), 0)
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0

  // Breakdown by Payment Method
  const paymentBreakdown: Record<string, { method: string; count: number; total: number }> = {}
  // Breakdown by Order Type
  const orderTypeBreakdown: Record<string, { orderType: string; count: number; total: number }> = {}
  // Daily revenue series
  const dailyMap = new Map<string, { date: string; orders: number; revenue: number }>()
  // Top products
  const productMap = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>()

  for (const order of validOrders) {
    const pm = order.payment?.method || 'CASH'
    if (!paymentBreakdown[pm]) paymentBreakdown[pm] = { method: pm, count: 0, total: 0 }
    paymentBreakdown[pm].count += 1
    paymentBreakdown[pm].total += Number(order.totalAmount)

    const ot = order.orderType
    if (!orderTypeBreakdown[ot]) orderTypeBreakdown[ot] = { orderType: ot, count: 0, total: 0 }
    orderTypeBreakdown[ot].count += 1
    orderTypeBreakdown[ot].total += Number(order.totalAmount)

    const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(order.createdAt)
    const dayEntry = dailyMap.get(dayKey) || { date: dayKey, orders: 0, revenue: 0 }
    dayEntry.orders += 1
    dayEntry.revenue += Number(order.totalAmount)
    dailyMap.set(dayKey, dayEntry)

    for (const item of order.items) {
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        quantity: 0,
        revenue: 0
      }
      existing.quantity += item.quantity
      existing.revenue += Number(item.lineTotal)
      productMap.set(item.productId, existing)
    }
  }

  return {
    data: {
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      summary: {
        totalRevenue,
        totalOrders: validOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalDiscount,
        averageOrderValue
      },
      dailySeries: Array.from(dailyMap.values()),
      paymentBreakdown: Object.values(paymentBreakdown),
      orderTypeBreakdown: Object.values(orderTypeBreakdown),
      topProducts: Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
    }
  }
})
