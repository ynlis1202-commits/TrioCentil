import { NotificationType, OrderStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { createOrderSchema } from '../../utils/validation'
import { calculateItemPricing, calculateOrderTotals, generateOrderNumber } from '../../utils/pricing'
import { buildWhatsappOrderMessage, buildWhatsappUrl } from '../../utils/whatsapp'
import { checkRateLimit } from '../../utils/rateLimit'
import { getSessionUser } from '../../utils/auth'
import { getStoreSettingsMap } from '../../utils/settings'
import { serializeOrder } from '../../utils/serializers'
import { formatRupiah, normalizeWhatsappNumber, ORDER_TYPE_LABELS } from '../../../shared/utils/format'

export default defineEventHandler(async (event) => {
  // Rate limiting checkout: maksimal 15 pesanan per 10 menit per IP
  checkRateLimit(event, { keyPrefix: 'create-order', maxRequests: 15, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data pesanan tidak valid.',
      data: { errors: parsed.error.flatten().fieldErrors }
    })
  }

  const input = parsed.data
  const settings = await getStoreSettingsMap()
  if (settings.store_is_open === 'false') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Maaf, Warung Makan TrioCentil sedang tutup untuk pemesanan online saat ini.'
    })
  }

  if (input.paymentMethod === 'QRIS' && settings.qris_enabled !== 'true') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pembayaran QRIS belum diaktifkan. Silakan pilih Tunai atau Transfer Bank.'
    })
  }

  // Fetch all referenced products from database (server-side price calculation!)
  const productIds = [...new Set(input.items.map((item) => item.productId))]
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true }
  })

  const productById = new Map(dbProducts.map((p) => [p.id, p]))
  const pricedLines: Array<{
    productId: string
    productName: string
    basePrice: number
    extraSambalPrice: number
    variantsPriceDelta: number
    unitPrice: number
    quantity: number
    lineTotal: number
    spicyLevel: string | null
    extraSambal: string | null
    selectedVariants: Array<{ id: string; name: string; priceDelta: number }>
    itemNotes: string | null
  }> = []

  for (const reqItem of input.items) {
    const product = productById.get(reqItem.productId)
    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Salah satu menu di keranjang tidak ditemukan.'
      })
    }
    if (!product.isAvailable || product.stock < reqItem.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maaf, stok menu "${product.name}" tidak mencukupi atau sedang habis.`
      })
    }

    // Match extra sambal price strictly on server
    const sambalOptions = Array.isArray(product.extraSambalOptions)
      ? (product.extraSambalOptions as Array<{ name: string; price: number }>)
      : []
    const matchedSambal = reqItem.extraSambalName
      ? sambalOptions.find((s) => s.name === reqItem.extraSambalName)
      : undefined
    const extraSambalPrice = matchedSambal ? Number(matchedSambal.price) : 0

    // Match selected variants strictly on server
    const matchedVariants = (reqItem.variantIds || [])
      .map((vid) => product.variants.find((v) => v.id === vid && v.isAvailable))
      .filter((v): v is NonNullable<typeof v> => Boolean(v))
      .map((v) => ({
        id: v.id,
        name: v.name,
        priceDelta: Number(v.priceDelta)
      }))

    const variantsPriceDelta = matchedVariants.reduce((sum, v) => sum + v.priceDelta, 0)
    const { unitPrice, lineTotal } = calculateItemPricing({
      basePrice: Number(product.price),
      quantity: reqItem.quantity,
      extraSambalPrice,
      variantsPriceDelta
    })

    pricedLines.push({
      productId: product.id,
      productName: product.name,
      basePrice: Number(product.price),
      extraSambalPrice,
      variantsPriceDelta,
      unitPrice,
      quantity: reqItem.quantity,
      lineTotal,
      spicyLevel: reqItem.spicyLevel || null,
      extraSambal: matchedSambal ? matchedSambal.name : null,
      selectedVariants: matchedVariants,
      itemNotes: reqItem.itemNotes || null
    })
  }

  // Validate promotion server-side if provided
  let promotion: {
    id: string
    code: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    minOrderAmount: number
    maxDiscount: number | null
  } | null = null

  if (input.promoCode) {
    const code = input.promoCode.toUpperCase()
    const now = new Date()
    const found = await prisma.promotion.findUnique({ where: { code } })
    if (!found || !found.isActive || found.startDate > now || found.endDate < now) {
      throw createError({ statusCode: 400, statusMessage: 'Kode promo tidak valid atau sudah kedaluwarsa.' })
    }
    if (found.usageLimit !== null && found.usedCount >= found.usageLimit) {
      throw createError({ statusCode: 400, statusMessage: 'Kuota kode promo sudah habis.' })
    }
    promotion = {
      id: found.id,
      code: found.code,
      discountType: found.discountType,
      discountValue: Number(found.discountValue),
      minOrderAmount: Number(found.minOrderAmount),
      maxDiscount: found.maxDiscount !== null ? Number(found.maxDiscount) : null
    }
  }

  const totals = calculateOrderTotals({
    items: pricedLines,
    orderType: input.orderType,
    baseDeliveryFee: Number(settings.delivery_fee || 10000),
    freeDeliveryMin: Number(settings.free_delivery_min || 75000),
    promotion
  })

  const normalizedWa = normalizeWhatsappNumber(input.customerWhatsapp)
  const sessionUser = await getSessionUser(event)
  const orderNumber = generateOrderNumber()
  const config = useRuntimeConfig()

  // Persist everything transactionally (extended timeout for cloud serverless DB)
  let createdOrder
  try {
    createdOrder = await prisma.$transaction(
      async (tx) => {
        // Safely determine whether sessionUser can be linked without violating unique userId
        let linkUserId: string | null = null
        if (sessionUser?.role === 'CUSTOMER') {
          const existingByUser = await tx.customer.findUnique({
            where: { userId: sessionUser.id },
            select: { id: true, whatsapp: true }
          })
          if (!existingByUser || existingByUser.whatsapp === normalizedWa) {
            linkUserId = sessionUser.id
          }
        }

        const customer = await tx.customer.upsert({
          where: { whatsapp: normalizedWa },
          update: {
            name: input.customerName,
            defaultAddress: input.deliveryAddress || undefined,
            totalOrders: { increment: 1 },
            totalSpent: { increment: totals.totalAmount },
            ...(linkUserId ? { userId: linkUserId } : {})
          },
          create: {
            name: input.customerName,
            whatsapp: normalizedWa,
            email: sessionUser?.role === 'CUSTOMER' ? sessionUser.email : null,
            userId: linkUserId,
            defaultAddress: input.deliveryAddress || null,
            totalOrders: 1,
            totalSpent: totals.totalAmount
          }
        })

        // Decrement product stocks in parallel
        await Promise.all(
          pricedLines.map((line) =>
            tx.product.update({
              where: { id: line.productId },
              data: { stock: { decrement: line.quantity } }
            })
          )
        )

        if (promotion && totals.discountAmount > 0) {
          await tx.promotion.update({
            where: { id: promotion.id },
            data: { usedCount: { increment: 1 } }
          })
        }

        const qrisPayload =
          input.paymentMethod === 'QRIS'
            ? config.qrisStaticPayload || `QRIS:TRIOCENTIL:${orderNumber}:${totals.totalAmount}`
            : null

        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            userId: sessionUser?.id || null,
            customerName: input.customerName,
            customerWhatsapp: normalizedWa,
            orderType: input.orderType,
            deliveryAddress: input.orderType === 'DELIVERY' ? input.deliveryAddress : null,
            tableNumber: input.orderType === 'DINE_IN' ? input.tableNumber : null,
            notes: input.notes || null,
            subtotal: totals.subtotal,
            deliveryFee: totals.deliveryFee,
            discountAmount: totals.discountAmount,
            totalAmount: totals.totalAmount,
            promoCode: promotion && totals.discountAmount > 0 ? promotion.code : null,
            promotionId: promotion && totals.discountAmount > 0 ? promotion.id : null,
            status: OrderStatus.PENDING_CONFIRMATION,
            items: {
              create: pricedLines.map((line) => ({
                productId: line.productId,
                productName: line.productName,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
                spicyLevel: line.spicyLevel,
                extraSambal: line.extraSambal,
                selectedVariants: line.selectedVariants,
                itemNotes: line.itemNotes,
                lineTotal: line.lineTotal
              }))
            },
            statusHistories: {
              create: {
                toStatus: OrderStatus.PENDING_CONFIRMATION,
                note: 'Pesanan berhasil dibuat dan menunggu konfirmasi Warung Makan TrioCentil.'
              }
            },
            payment: {
              create: {
                method: input.paymentMethod,
                status: PaymentStatus.PENDING,
                amount: totals.totalAmount,
                qrisPayload
              }
            }
          },
          include: {
            items: true,
            payment: true,
            statusHistories: { orderBy: { createdAt: 'desc' } }
          }
        })

        // Create internal notification for admin dashboard
        await tx.notification.create({
          data: {
            type: NotificationType.NEW_ORDER,
            title: `Pesanan Baru #${order.orderNumber}`,
            message: `${input.customerName} (${ORDER_TYPE_LABELS[input.orderType]}) — ${formatRupiah(totals.totalAmount)}`,
            orderId: order.id
          }
        })

        return order
      },
      { maxWait: 15000, timeout: 25000 }
    )
  } catch (err: any) {
    console.error('[POST /api/orders] Transaction failed:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menyimpan pesanan ke database. Silakan coba lagi sebentar.'
    })
  }

  const trackingUrl = `${config.public.appUrl.replace(/\/$/, '')}/pesanan/${createdOrder.orderNumber}`
  const whatsappMessage = buildWhatsappOrderMessage({
    orderNumber: createdOrder.orderNumber,
    customerName: createdOrder.customerName,
    customerWhatsapp: createdOrder.customerWhatsapp,
    orderType: createdOrder.orderType,
    deliveryAddress: createdOrder.deliveryAddress,
    tableNumber: createdOrder.tableNumber,
    paymentMethod: input.paymentMethod,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discountAmount: totals.discountAmount,
    totalAmount: totals.totalAmount,
    notes: createdOrder.notes,
    items: pricedLines.map((l) => ({
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      spicyLevel: l.spicyLevel,
      extraSambal: l.extraSambal,
      itemNotes: l.itemNotes
    })),
    trackingUrl
  })

  const whatsappUrl = buildWhatsappUrl(settings.store_whatsapp, whatsappMessage)

  setResponseStatus(event, 201)
  return {
    data: {
      order: serializeOrder(createdOrder),
      whatsappUrl,
      whatsappMessage,
      note: 'Pesanan tercatat dengan status Menunggu Konfirmasi. Membuka WhatsApp tidak otomatis mengonfirmasi pesanan hingga diverifikasi oleh kasir.'
    }
  }
})
