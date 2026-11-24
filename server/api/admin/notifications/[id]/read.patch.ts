import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID notifikasi tidak valid.' })

  if (id === 'all') {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    })
    return { success: true }
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })

  return { success: true }
})
