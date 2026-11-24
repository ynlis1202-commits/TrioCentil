export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'COOKING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'QRIS'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface ProductImageDTO {
  id: string
  url: string
  alt: string | null
  isPrimary: boolean
  sortOrder: number
}

export interface ProductVariantDTO {
  id: string
  name: string
  type: 'PORTION' | 'SAMBAL' | 'ADDON' | 'SPICY'
  priceDelta: number
  isAvailable: boolean
  sortOrder: number
}

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  productCount?: number
}

export interface ProductDTO {
  id: string
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
  }
  name: string
  slug: string
  description: string
  shortDescription: string | null
  price: number
  comparePrice: number | null
  sku: string | null
  isAvailable: boolean
  stock: number
  isFeatured: boolean
  isBestSeller: boolean
  rating: number
  reviewCount: number
  preparationTime: number
  spicyOptions: string[]
  extraSambalOptions: Array<{ name: string; price: number }>
  images: ProductImageDTO[]
  variants: ProductVariantDTO[]
}

export interface CartItem {
  key: string
  productId: string
  slug: string
  name: string
  image: string
  basePrice: number
  unitPrice: number
  quantity: number
  spicyLevel?: string
  extraSambal?: { name: string; price: number } | null
  selectedVariants?: Array<{ id: string; name: string; priceDelta: number }>
  itemNotes?: string
}

export interface PromotionDTO {
  id: string
  code: string
  title: string
  description: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  startDate: string
  endDate: string
  isActive: boolean
  badgeText: string | null
}

export interface PublicStoreSettings {
  store_name: string
  store_tagline: string
  store_address: string
  store_phone: string
  store_whatsapp: string
  store_hours_weekday: string
  store_hours_weekend: string
  store_is_open: string
  delivery_fee: string
  free_delivery_min: string
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  qris_enabled: string
  qris_merchant_name: string
  store_maps_url: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
}
