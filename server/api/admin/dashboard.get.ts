import { OrderStatus } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/auth'
import { serializeOrder } from '../../utils/serializers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const days = Math.min(30, Math.max(7, Number(query.days || 7)))

  const now = new Date()
  // Start of today in Asia/Jakarta (+07:00)
  const jakartaDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
  const startOfToday = new Date(`${jakartaDateStr}T00:00:00+07:00`)

  const startOfChart = new Date(startOfToday)
  startOfChart.setDate(startOfChart.getDate() - (days - 1))

  const [
    todayOrders,
    totalOrdersCount,
    newOrdersCount,
    processingOrdersCount,
    recentOrders,
    chartOrders,
    topProductsRaw,
    notifications
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        status: { not: OrderStatus.CANCELLED }
      },
      select: { totalAmount: true }
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING_CONFIRMATION } }),
    prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.COOKING, OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY]
        }
      }
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        items: true,
        payment: true
      }
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: startOfChart },
        status: { not: OrderStatus.CANCELLED }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          status: { not: OrderStatus.CANCELLED }
        }
      },
      _sum: {
        quantity: true,
        lineTotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

  // Build daily sales chart series
  const dailyMap = new Map<string, { date: string; label: string; revenue: number; orders: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(startOfChart)
    d.setDate(startOfChart.getDate() + i)
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d)
    const label = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short'
    }).format(d)
    dailyMap.set(key, { date: key, label, revenue: 0, orders: 0 })
  }

  for (const ord of chartOrders) {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(ord.createdAt)
    const entry = dailyMap.get(key)
    if (entry) {
      entry.revenue += Number(ord.totalAmount)
      entry.orders += 1
    }
  }

  return {
    data: {
      summary: {
        todaySales,
        todayOrdersCount: todayOrders.length,
        totalOrders: totalOrdersCount,
        newOrders: newOrdersCount,
        processingOrders: processingOrdersCount
      },
      salesChart: Array.from(dailyMap.values()),
      bestSellers: topProductsRaw.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.lineTotal || 0)
      })),
      recentOrders: recentOrders.map(serializeOrder),
      notifications,
      unreadNotificationsCount: notifications.filter((n) => !n.isRead).length
    }
  }
})
