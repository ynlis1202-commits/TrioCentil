import { prisma } from '../../utils/prisma'
import { serializeOrder } from '../../utils/serializers'
import { buildWhatsappOrderMessage, buildWhatsappUrl } from '../../utils/whatsapp'
import { getStoreSettingsMap } from '../../utils/settings'

export default defineEventHandler(async (event) => {
  const orderNumber = getRouterParam(event, 'orderNumber')?.trim().toUpperCase()
  if (!orderNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor pesanan tidak valid.' })
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payment: true,
      statusHistories: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan.' })
  }

  const settings = await getStoreSettingsMap()
  const config = useRuntimeConfig()
  const trackingUrl = `${config.public.appUrl.replace(/\/$/, '')}/pesanan/${order.orderNumber}`

  const whatsappMessage = buildWhatsappOrderMessage({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerWhatsapp: order.customerWhatsapp,
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    tableNumber: order.tableNumber,
    paymentMethod: order.payment?.method || 'CASH',
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    notes: order.notes,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      spicyLevel: item.spicyLevel,
      extraSambal: item.extraSambal,
      itemNotes: item.itemNotes
    })),
    trackingUrl
  })

  const whatsappUrl = buildWhatsappUrl(settings.store_whatsapp, whatsappMessage)

  return {
    data: {
      order: serializeOrder(order),
      whatsappUrl,
      whatsappMessage,
      paymentInfo: {
        bankName: settings.bank_name,
        bankAccountNumber: settings.bank_account_number,
        bankAccountHolder: settings.bank_account_holder,
        qrisEnabled: settings.qris_enabled === 'true',
        qrisMerchantName: settings.qris_merchant_name
      }
    }
  }
})
