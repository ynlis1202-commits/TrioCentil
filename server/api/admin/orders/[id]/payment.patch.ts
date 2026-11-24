import { NotificationType } from '@prisma/client'
import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/auth'
import { updatePaymentStatusSchema } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID pesanan tidak valid.' })

  const body = await readBody(event)
  const parsed = updatePaymentStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Status pembayaran tidak valid.'
    })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true }
  })
  if (!order || !order.payment) {
    throw createError({ statusCode: 404, statusMessage: 'Data pembayaran pesanan tidak ditemukan.' })
  }

  const updated = await prisma.payment.update({
    where: { orderId: id },
    data: {
      status: parsed.data.status,
      referenceCode: parsed.data.referenceCode ?? order.payment.referenceCode,
      paidAt: parsed.data.status === 'PAID' ? new Date() : null
    }
  })

  await prisma.notification.create({
    data: {
      type: NotificationType.PAYMENT,
      title: `Pembayaran #${order.orderNumber} (${parsed.data.status})`,
      message: `${admin.name} memperbarui status pembayaran pesanan ${order.customerName}.`,
      orderId: order.id
    }
  })

  return {
    data: {
      ...updated,
      amount: Number(updated.amount)
    }
  }
})
