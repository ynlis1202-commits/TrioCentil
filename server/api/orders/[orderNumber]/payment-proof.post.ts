import { NotificationType } from '@prisma/client'
import { prisma } from '../../../utils/prisma'
import { checkRateLimit } from '../../../utils/rateLimit'

const MAX_PROOF_SIZE = 3 * 1024 * 1024 // 3 MB

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png'
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { keyPrefix: 'payment-proof', maxRequests: 15, windowMs: 10 * 60 * 1000 })

  const orderNumber = getRouterParam(event, 'orderNumber')?.trim().toUpperCase()
  if (!orderNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor pesanan tidak valid.' })
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payment: true }
  })

  if (!order || !order.payment) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan.' })
  }

  if (order.status === 'CANCELLED') {
    throw createError({ statusCode: 400, statusMessage: 'Pesanan yang dibatalkan tidak dapat mengunggah bukti pembayaran.' })
  }

  if (order.payment.status === 'PAID') {
    throw createError({ statusCode: 400, statusMessage: 'Pembayaran untuk pesanan ini sudah terverifikasi Lunas.' })
  }

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find((part) => part.name === 'file' && part.data)
  const senderNotePart = formData?.find((part) => part.name === 'senderNote' && part.data)

  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'File bukti pembayaran wajib diunggah.' })
  }

  if (filePart.data.length > MAX_PROOF_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran gambar maksimal 3 MB.' })
  }

  const mime = detectImageMime(filePart.data)
  if (!mime) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format gambar tidak didukung. Gunakan file JPG, PNG, atau WEBP yang valid.'
    })
  }

  const senderNote = senderNotePart?.data
    ? senderNotePart.data.toString('utf8').trim().slice(0, 100)
    : undefined

  // Store as base64 Data URL in TiDB Cloud LongText (100% compatible with Vercel read-only serverless FS)
  const dataUrl = `data:${mime};base64,${filePart.data.toString('base64')}`

  const updated = await prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.update({
        where: { orderId: order.id },
        data: {
          proofUrl: dataUrl,
          ...(senderNote ? { referenceCode: senderNote } : {})
        }
      })

      await tx.notification.create({
        data: {
          type: NotificationType.PAYMENT,
          title: `Bukti Bayar #${order.orderNumber}`,
          message: `${order.customerName} mengunggah bukti pembayaran${senderNote ? ` (${senderNote})` : ''}. Mohon segera diverifikasi.`,
          orderId: order.id
        }
      })

      return payment
    },
    { maxWait: 15000, timeout: 25000 }
  )

  return {
    data: {
      proofUrl: updated.proofUrl,
      referenceCode: updated.referenceCode,
      status: updated.status
    }
  }
})
