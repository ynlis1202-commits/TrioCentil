import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID produk tidak valid.' })
  }

  const orderItemsCount = await prisma.orderItem.count({ where: { productId: id } })
  if (orderItemsCount > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Produk ini sudah memiliki riwayat pesanan. Nonaktifkan ketersediaan produk sebagai gantinya.'
    })
  }

  await prisma.product.delete({ where: { id } })
  return { success: true }
})
