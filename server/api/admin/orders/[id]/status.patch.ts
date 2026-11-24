import { NotificationType } from '@prisma/client'
import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/auth'
import { updateOrderStatusSchema } from '../../../../utils/validation'
import { serializeOrder } from '../../../../utils/serializers'
import { ORDER_STATUS_META } from '../../../../../shared/utils/format'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID pesanan tidak valid.' })

  const body = await readBody(event)
  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Status pesanan tidak valid.'
    })
  }

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan.' })
  }

  const nextStatus = parsed.data.status
  const statusLabel = ORDER_STATUS_META[nextStatus]?.label || nextStatus

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        items: true,
        payment: true,
        statusHistories: { orderBy: { createdAt: 'desc' } }
      }
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: existing.status,
        toStatus: nextStatus,
        note: parsed.data.note || `Status diperbarui menjadi ${statusLabel}`,
        changedById: admin.id
      }
    })

    await tx.notification.create({
      data: {
        type: NotificationType.ORDER_STATUS,
        title: `Status #${existing.orderNumber}: ${statusLabel}`,
        message: `${admin.name} mengubah status pesanan ${existing.customerName} menjadi ${statusLabel}.`,
        orderId: id
      }
    })

    return tx.order.findUniqueOrThrow({
      where: { id },
      include: {
        items: true,
        payment: true,
        statusHistories: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { name: true, role: true } } }
        }
      }
    })
  },
  { maxWait: 15000, timeout: 25000 }
  )

  return {
    data: serializeOrder(updated)
  }
})
