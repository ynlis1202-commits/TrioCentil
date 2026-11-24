<script setup lang="ts">
import {
  ArrowLeft,
  Star,
  Clock,
  Minus,
  Plus,
  ShoppingBag,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import type { ProductDTO } from '~~/shared/types'
import { formatRupiah } from '~~/shared/utils/format'

const route = useRoute()
const cart = useCartStore()
const toast = useToast()

const slug = computed(() => String(route.params.slug || ''))

const {
  data: res,
  pending,
  error
} = await useFetch<{ data: ProductDTO; related: ProductDTO[] }>(() => `/api/products/${slug.value}`)

const product = computed(() => res.value?.data)
const relatedProducts = computed(() => res.value?.related || [])

useHead({
  title: computed(() => product.value?.name || 'Detail Menu')
})

const activeImage = ref<string>('')
const quantity = ref(1)
const selectedSpicy = ref<string>('')
const selectedSambal = ref<{ name: string; price: number } | null>(null)
const selectedVariantIds = ref<string[]>([])
const itemNotes = ref('')

watch(
  product,
  (p) => {
    if (!p) return
    activeImage.value = p.images[0]?.url || '/images/sate-original.jpg'
    quantity.value = 1
    selectedSpicy.value = p.spicyOptions?.[0] || ''
    selectedSambal.value = p.extraSambalOptions?.[0] || null
    selectedVariantIds.value = []
    itemNotes.value = ''
  },
  { immediate: true }
)

function toggleVariant(id: string) {
  if (selectedVariantIds.value.includes(id)) {
    selectedVariantIds.value = selectedVariantIds.value.filter((v) => v !== id)
  } else {
    selectedVariantIds.value = [...selectedVariantIds.value, id]
  }
}

const selectedVariantsObjects = computed(() => {
  if (!product.value) return []
  return product.value.variants
    .filter((v) => selectedVariantIds.value.includes(v.id))
    .map((v) => ({ id: v.id, name: v.name, priceDelta: v.priceDelta }))
})

const calculatedUnitPrice = computed(() => {
  if (!product.value) return 0
  const sambalPrice = selectedSambal.value?.price || 0
  const variantsPrice = selectedVariantsObjects.value.reduce((s, v) => s + v.priceDelta, 0)
  return product.value.price + sambalPrice + variantsPrice
})

const totalLinePrice = computed(() => calculatedUnitPrice.value * quantity.value)

function addToCart() {
  if (!product.value || !product.value.isAvailable || product.value.stock <= 0) return

  cart.addItem(product.value, {
    quantity: quantity.value,
    spicyLevel: selectedSpicy.value || undefined,
    extraSambal: selectedSambal.value,
    selectedVariants: selectedVariantsObjects.value,
    itemNotes: itemNotes.value
  })

  toast.add({
    title: 'Berhasil Masuk Keranjang!',
    description: `${quantity.value}x ${product.value.name} siap dipesan.`,
    color: 'primary'
  })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
    <!-- Breadcrumb -->
    <NuxtLink
      to="/menu"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-[#EC4899] mb-6"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Kembali ke Daftar Menu</span>
    </NuxtLink>

    <!-- Loading -->
    <div v-if="pending" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-6 h-96 rounded-3xl bg-pink-100/60 animate-pulse" />
      <div class="lg:col-span-6 space-y-4">
        <div class="h-8 w-2/3 rounded-xl bg-pink-100/60 animate-pulse" />
        <div class="h-24 rounded-xl bg-pink-100/40 animate-pulse" />
        <div class="h-48 rounded-xl bg-pink-100/40 animate-pulse" />
      </div>
    </div>

    <!-- Error / Not Found -->
    <div
      v-else-if="error || !product"
      class="p-12 rounded-3xl bg-white border border-pink-100 text-center space-y-4"
    >
      <AlertCircle class="w-12 h-12 text-[#E11D48] mx-auto" />
      <h1 class="font-display font-bold text-xl text-[#292524]">Menu Tidak Ditemukan</h1>
      <p class="text-sm text-stone-500">Menu yang Anda cari mungkin sudah tidak tersedia.</p>
      <NuxtLink
        to="/menu"
        class="inline-flex px-5 py-2.5 rounded-full bg-[#EC4899] text-white text-sm font-bold"
      >
        Lihat Menu Lainnya
      </NuxtLink>
    </div>

    <!-- Product Detail Content -->
    <div v-else class="space-y-14">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <!-- Images -->
        <div class="lg:col-span-6 space-y-3">
          <div class="relative rounded-3xl overflow-hidden bg-[#FFF5F8] border border-pink-100 shadow-sm aspect-[4/3]">
            <img
              :src="activeImage || '/images/sate-original.jpg'"
              :alt="product.name"
              class="w-full h-full object-cover"
            >
            <span
              v-if="product.isBestSeller"
              class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EC4899] text-white text-xs font-bold shadow"
            >
              <Flame class="w-3.5 h-3.5" />
              Best Seller
            </span>
          </div>

          <div v-if="product.images.length > 1" class="flex gap-3 overflow-x-auto pb-1">
            <button
              v-for="img in product.images"
              :key="img.id"
              type="button"
              class="w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer"
              :class="activeImage === img.url ? 'border-[#EC4899]' : 'border-transparent'"
              @click="activeImage = img.url"
            >
              <img :src="img.url" :alt="img.alt || product.name" class="w-full h-full object-cover">
            </button>
          </div>
        </div>

        <!-- Product Info & Customizer -->
        <div class="lg:col-span-6 space-y-6">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span
                v-if="product.category"
                class="px-3 py-1 rounded-full bg-[#FFF5F8] border border-pink-100 text-[#9D174D] text-xs font-bold"
              >
                {{ product.category.name }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                :class="
                  product.isAvailable && product.stock > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-700'
                "
              >
                <CheckCircle2 v-if="product.isAvailable && product.stock > 0" class="w-3.5 h-3.5" />
                {{ product.isAvailable && product.stock > 0 ? `Tersedia (Stok ${product.stock})` : 'Stok Habis' }}
              </span>
            </div>

            <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#292524]">
              {{ product.name }}
            </h1>

            <div class="flex items-center gap-4 mt-2 text-sm text-stone-500">
              <span class="inline-flex items-center gap-1 font-semibold text-amber-600">
                <Star class="w-4 h-4 fill-amber-400 text-amber-400" />
                {{ product.rating.toFixed(1) }}
                <span class="text-stone-400 font-normal">({{ product.reviewCount }} ulasan)</span>
              </span>
              <span class="inline-flex items-center gap-1">
                <Clock class="w-4 h-4 text-stone-400" />
                Estimasi {{ product.preparationTime }} menit
              </span>
            </div>

            <div class="mt-4 flex items-baseline gap-3">
              <span class="font-display font-extrabold text-3xl text-[#9D174D]">
                {{ formatRupiah(product.price) }}
              </span>
              <span
                v-if="product.comparePrice && product.comparePrice > product.price"
                class="text-base text-stone-400 line-through"
              >
                {{ formatRupiah(product.comparePrice) }}
              </span>
            </div>

            <p class="text-sm sm:text-base text-stone-600 mt-4 leading-relaxed">
              {{ product.description }}
            </p>
          </div>

          <!-- Customization Card -->
          <div class="bg-white rounded-2xl border border-pink-100 p-5 space-y-5 shadow-xs">
            <!-- Tingkat Kepedasan -->
            <div v-if="product.spicyOptions.length > 0">
              <label class="block text-sm font-bold text-[#292524] mb-2.5">
                Tingkat Kepedasan
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  v-for="level in product.spicyOptions"
                  :key="level"
                  type="button"
                  class="px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                  :class="
                    selectedSpicy === level
                      ? 'bg-[#EC4899] border-[#EC4899] text-white shadow-xs'
                      : 'bg-[#FFF5F8] border-pink-100 text-[#9D174D] hover:border-pink-300'
                  "
                  @click="selectedSpicy = level"
                >
                  {{ level }}
                </button>
              </div>
            </div>

            <!-- Pilihan Tambahan Sambal -->
            <div v-if="product.extraSambalOptions.length > 0">
              <label class="block text-sm font-bold text-[#292524] mb-2.5">
                Pilihan Tambahan Sambal
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  v-for="sambal in product.extraSambalOptions"
                  :key="sambal.name"
                  type="button"
                  class="flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer"
                  :class="
                    selectedSambal?.name === sambal.name
                      ? 'bg-[#FFF5F8] border-[#EC4899] text-[#9D174D] ring-1 ring-[#EC4899]'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-pink-200'
                  "
                  @click="selectedSambal = sambal"
                >
                  <span>{{ sambal.name }}</span>
                  <span class="font-bold text-[#EC4899]">
                    {{ sambal.price > 0 ? `+${formatRupiah(sambal.price)}` : 'Gratis' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Varian / Add-on -->
            <div v-if="product.variants.length > 0">
              <label class="block text-sm font-bold text-[#292524] mb-2.5">
                Pilihan Porsi & Tambahan (Opsional)
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  v-for="variant in product.variants"
                  :key="variant.id"
                  type="button"
                  :disabled="!variant.isAvailable"
                  class="flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                  :class="
                    selectedVariantIds.includes(variant.id)
                      ? 'bg-[#FFF5F8] border-[#EC4899] text-[#9D174D] ring-1 ring-[#EC4899]'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-pink-200'
                  "
                  @click="toggleVariant(variant.id)"
                >
                  <span>{{ variant.name }}</span>
                  <span class="font-bold text-[#EC4899]">
                    {{ variant.priceDelta > 0 ? `+${formatRupiah(variant.priceDelta)}` : 'Standar' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Catatan Khusus -->
            <div>
              <label for="item-notes" class="block text-sm font-bold text-[#292524] mb-2">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                id="item-notes"
                v-model="itemNotes"
                rows="2"
                maxlength="300"
                placeholder="Contoh: Bumbu kacang dipisah, tanpa bawang merah, bakar agak kering..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] focus:ring-2 focus:ring-pink-100 outline-none text-sm resize-none"
              />
            </div>

            <!-- Quantity & Add to Cart -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div class="inline-flex items-center justify-between sm:justify-center gap-4 px-3 py-2 rounded-full bg-[#FFF5F8] border border-pink-200">
                <button
                  type="button"
                  class="w-8 h-8 rounded-full bg-white text-[#9D174D] flex items-center justify-center hover:bg-pink-100 cursor-pointer"
                  @click="quantity = Math.max(1, quantity - 1)"
                >
                  <Minus class="w-4 h-4" />
                </button>
                <span class="font-display font-extrabold text-base w-8 text-center text-[#292524]">
                  {{ quantity }}
                </span>
                <button
                  type="button"
                  class="w-8 h-8 rounded-full bg-white text-[#9D174D] flex items-center justify-center hover:bg-pink-100 cursor-pointer"
                  @click="quantity = Math.min(product.stock, quantity + 1)"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                :disabled="!product.isAvailable || product.stock <= 0"
                class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] disabled:bg-stone-300 text-white font-bold text-sm sm:text-base shadow-md shadow-pink-500/20 transition-all active:scale-95 cursor-pointer"
                @click="addToCart"
              >
                <ShoppingBag class="w-5 h-5" />
                <span>Tambah ke Keranjang • {{ formatRupiah(totalLinePrice) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <section v-if="relatedProducts.length > 0" class="pt-6 border-t border-pink-100">
        <h2 class="font-display font-extrabold text-xl sm:text-2xl text-[#292524] mb-6">
          Menu Serupa yang Mungkin Kamu Suka
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ProductCard v-for="rel in relatedProducts" :key="rel.id" :product="rel" />
        </div>
      </section>
    </div>
  </div>
</template>
