<script setup lang="ts">
import { Star, Plus, Heart } from 'lucide-vue-next'
import type { ProductDTO } from '~~/shared/types'
import { formatRupiah } from '~~/shared/utils/format'

const props = defineProps<{
  product: ProductDTO
}>()

const cart = useCartStore()
const toast = useToast()
const liked = ref(false)

const primaryImage = computed(() => props.product.images[0]?.url || '/images/sate-original.jpg')

function handleQuickAdd() {
  if (!props.product.isAvailable || props.product.stock <= 0) return
  cart.addItem(props.product, {
    quantity: 1,
    spicyLevel: props.product.spicyOptions?.[0]
  })
  toast.add({
    title: 'Ditambahkan ke Keranjang',
    description: `${props.product.name} berhasil masuk keranjang.`,
    color: 'primary'
  })
}
</script>

<template>
  <article
    class="group bg-white rounded-2xl border border-pink-100/90 shadow-[0_2px_12px_rgba(236,72,153,0.05)] hover:shadow-[0_10px_28px_rgba(236,72,153,0.12)] hover:border-pink-200 transition-all duration-200 flex flex-col overflow-hidden h-full"
  >
    <!-- Product Photo (matching reference rounded card with heart icon top-right) -->
    <div class="relative aspect-[4/3] overflow-hidden bg-[#FFF5F8]">
      <NuxtLink :to="`/menu/${product.slug}`" class="block w-full h-full">
        <img
          :src="primaryImage"
          :alt="product.name"
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        >
      </NuxtLink>

      <!-- Top-left subtle badge -->
      <span
        v-if="product.isBestSeller"
        class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#EC4899]/95 text-white text-[10px] font-bold tracking-wide shadow-xs"
      >
        Best Seller
      </span>

      <!-- Top-right Heart button (matching reference!) -->
      <button
        type="button"
        aria-label="Favorit"
        class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/35 backdrop-blur-xs text-white hover:bg-[#EC4899] flex items-center justify-center transition-colors cursor-pointer"
        @click.stop="liked = !liked"
      >
        <Heart class="w-4 h-4" :class="liked ? 'fill-[#F9A8D4] text-[#F9A8D4]' : ''" />
      </button>

      <!-- Rating pill bottom-left -->
      <span class="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-stone-700 shadow-2xs">
        <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
        {{ product.rating.toFixed(1) }}
      </span>

      <!-- Sold Out Overlay -->
      <div
        v-if="!product.isAvailable || product.stock <= 0"
        class="absolute inset-0 bg-stone-900/55 flex items-center justify-center"
      >
        <span class="px-3.5 py-1.5 rounded-full bg-white text-[#BE185D] text-xs font-extrabold uppercase tracking-wider">
          Habis Sementara
        </span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-4 flex flex-col flex-1">
      <NuxtLink
        :to="`/menu/${product.slug}`"
        class="font-display font-bold text-[#292524] group-hover:text-[#EC4899] transition-colors text-[15px] leading-snug line-clamp-1"
      >
        {{ product.name }}
      </NuxtLink>

      <p class="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed flex-1">
        {{ product.shortDescription || product.description }}
      </p>

      <!-- Price & Square Rounded + Button (matching reference!) -->
      <div class="mt-4 pt-2 flex items-center justify-between gap-2">
        <div>
          <span
            v-if="product.comparePrice && product.comparePrice > product.price"
            class="block text-[10px] text-stone-400 line-through"
          >
            {{ formatRupiah(product.comparePrice) }}
          </span>
          <span class="font-display font-extrabold text-[#292524] text-base">
            {{ formatRupiah(product.price) }}
          </span>
        </div>

        <button
          type="button"
          aria-label="Tambah ke keranjang"
          :disabled="!product.isAvailable || product.stock <= 0"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          :class="
            product.isAvailable && product.stock > 0
              ? 'bg-gradient-to-br from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] text-white shadow-pink-500/20'
              : 'bg-stone-200 text-stone-500'
          "
          @click="handleQuickAdd"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  </article>
</template>
