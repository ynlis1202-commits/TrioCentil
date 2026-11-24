import type { Prisma } from '@prisma/client'
import type { ProductDTO } from '../../shared/types'

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } }
    images: true
    variants: true
  }
}>

export function serializeProduct(product: ProductWithRelations): ProductDTO {
  return {
    id: product.id,
    categoryId: product.categoryId,
    category: product.category,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    comparePrice: product.comparePrice !== null ? Number(product.comparePrice) : null,
    sku: product.sku,
    isAvailable: product.isAvailable,
    stock: product.stock,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    preparationTime: product.preparationTime,
    spicyOptions: Array.isArray(product.spicyOptions) ? (product.spicyOptions as string[]) : [],
    extraSambalOptions: Array.isArray(product.extraSambalOptions)
      ? (product.extraSambalOptions as Array<{ name: string; price: number }>)
      : [],
    images: product.images
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder
      })),
    variants: product.variants
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((v) => ({
        id: v.id,
        name: v.name,
        type: v.type,
        priceDelta: Number(v.priceDelta),
        isAvailable: v.isAvailable,
        sortOrder: v.sortOrder
      }))
  }
}

export function serializeOrder(order: any) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    items: (order.items || []).map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal)
    })),
    payment: order.payment
      ? {
          ...order.payment,
          amount: Number(order.payment.amount)
        }
      : null
  }
}
