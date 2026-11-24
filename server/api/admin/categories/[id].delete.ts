import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID kategori tidak valid.' })

  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Kategori ini masih memiliki ${productCount} produk. Pindahkan atau hapus produk terlebih dahulu.`
    })
  }

  await prisma.category.delete({ where: { id } })
  return { success: true }
})
