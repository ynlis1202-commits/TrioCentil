import { defineStore } from 'pinia'
import type { CartItem, ProductDTO } from '~~/shared/types'

const STORAGE_KEY = 'triocentil_cart_v1'

interface AppliedPromo {
  code: string
  title: string
  discountAmount: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const orderNotes = ref('')
  const appliedPromo = ref<AppliedPromo | null>(null)
  const initialized = ref(false)

  const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  )

  const discountAmount = computed(() => {
    if (!appliedPromo.value) return 0
    return Math.min(appliedPromo.value.discountAmount, subtotal.value)
  })

  function persist() {
    if (import.meta.client) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: items.value,
          orderNotes: orderNotes.value
        })
      )
    }
  }

  function hydrate() {
    if (!import.meta.client || initialized.value) return
    initialized.value = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.items)) items.value = parsed.items
        if (typeof parsed.orderNotes === 'string') orderNotes.value = parsed.orderNotes
      }
    } catch {
      // Ignore corrupted local storage
    }
  }

  function buildItemKey(
    productId: string,
    spicyLevel?: string,
    extraSambalName?: string,
    variantIds: string[] = [],
    itemNotes?: string
  ): string {
    return [
      productId,
      spicyLevel || '',
      extraSambalName || '',
      variantIds.slice().sort().join(','),
      (itemNotes || '').trim()
    ].join('|')
  }

  function addItem(
    product: ProductDTO,
    options?: {
      quantity?: number
      spicyLevel?: string
      extraSambal?: { name: string; price: number } | null
      selectedVariants?: Array<{ id: string; name: string; priceDelta: number }>
      itemNotes?: string
    }
  ) {
    const qty = Math.max(1, options?.quantity ?? 1)
    const extraPrice = options?.extraSambal?.price ?? 0
    const variantsDelta = (options?.selectedVariants ?? []).reduce((s, v) => s + v.priceDelta, 0)
    const unitPrice = product.price + extraPrice + variantsDelta
    const variantIds = (options?.selectedVariants ?? []).map((v) => v.id)
    const key = buildItemKey(
      product.id,
      options?.spicyLevel,
      options?.extraSambal?.name,
      variantIds,
      options?.itemNotes
    )

    const existing = items.value.find((i) => i.key === key)
    if (existing) {
      existing.quantity = Math.min(50, existing.quantity + qty)
    } else {
      items.value.push({
        key,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url || '/images/sate-original.jpg',
        basePrice: product.price,
        unitPrice,
        quantity: qty,
        spicyLevel: options?.spicyLevel,
        extraSambal: options?.extraSambal ?? null,
        selectedVariants: options?.selectedVariants ?? [],
        itemNotes: options?.itemNotes?.trim() || undefined
      })
    }

    appliedPromo.value = null
    persist()
  }

  function updateQuantity(key: string, quantity: number) {
    const idx = items.value.findIndex((i) => i.key === key)
    if (idx === -1) return
    if (quantity <= 0) {
      items.value.splice(idx, 1)
    } else {
      items.value[idx]!.quantity = Math.min(50, quantity)
    }
    appliedPromo.value = null
    persist()
  }

  function removeItem(key: string) {
    items.value = items.value.filter((i) => i.key !== key)
    appliedPromo.value = null
    persist()
  }

  function setOrderNotes(notes: string) {
    orderNotes.value = notes
    persist()
  }

  function setPromo(promo: AppliedPromo | null) {
    appliedPromo.value = promo
  }

  function clearCart() {
    items.value = []
    orderNotes.value = ''
    appliedPromo.value = null
    persist()
  }

  return {
    items,
    orderNotes,
    appliedPromo,
    totalItems,
    subtotal,
    discountAmount,
    hydrate,
    addItem,
    updateQuantity,
    removeItem,
    setOrderNotes,
    setPromo,
    clearCart
  }
})
