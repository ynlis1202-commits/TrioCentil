import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  return {
    data: notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length
  }
})
