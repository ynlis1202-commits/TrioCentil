<script setup lang="ts">
import { Search, SlidersHorizontal, X } from 'lucide-vue-next'
import type { CategoryDTO, ProductDTO } from '~~/shared/types'

useHead({ title: 'Daftar Menu' })

const route = useRoute()
const router = useRouter()

const activeCategory = ref<string>((route.query.category as string) || 'semua')
const searchQuery = ref<string>((route.query.search as string) || '')
const sortBy = ref<string>('popular')

const { data: categoriesRes } = await useFetch<{ data: CategoryDTO[] }>('/api/categories')

const {
  data: productsRes,
  pending,
  error,
  refresh
} = await useFetch<{ data: ProductDTO[]; total: number }>('/api/products', {
  query: computed(() => ({
    category: activeCategory.value,
    search: searchQuery.value.trim() || undefined,
    sort: sortBy.value
  }))
})

const categories = computed(() => [
  { id: 'all', name: 'Semua', slug: 'semua' },
  ...(categoriesRes.value?.data || [])
])

const products = computed(() => productsRes.value?.data || [])

function selectCategory(slug: string) {
  activeCategory.value = slug
  router.replace({
    query: {
      ...route.query,
      category: slug === 'semua' ? undefined : slug
    }
  })
}

function clearFilters() {
  activeCategory.value = 'semua'
  searchQuery.value = ''
  sortBy.value = 'popular'
  router.replace({ query: {} })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <!-- Page Header -->
    <div class="mb-8">
      <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Katalog Menu</span>
      <h1 class="font-display font-extrabold text-2xl sm:text-4xl text-[#292524] mt-1">
        Pilih Menu Favoritmu
      </h1>
      <p class="text-sm text-stone-600 mt-1">
        Semua menu dibuat segar setiap hari. Klik menu untuk memilih tingkat kepedasan dan tambahan sambal.
      </p>
    </div>

    <!-- Search & Sort Bar -->
    <div class="bg-white rounded-2xl border border-pink-100 p-4 shadow-xs mb-6 space-y-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari sate ayam, nasi, lontong, es jeruk..."
            class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] focus:ring-2 focus:ring-pink-100 outline-none text-sm"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            @click="searchQuery = ''"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Sort Select -->
        <div class="flex items-center gap-2 sm:w-56">
          <SlidersHorizontal class="w-4 h-4 text-stone-400 shrink-0" />
          <select
            v-model="sortBy"
            class="w-full py-2.5 px-3 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm bg-white font-medium text-stone-700"
          >
            <option value="popular">Urutkan: Terpopuler</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
            <option value="newest">Menu Terbaru</option>
          </select>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat.slug"
          type="button"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer"
          :class="
            activeCategory === cat.slug
              ? 'bg-[#EC4899] text-white shadow-sm'
              : 'bg-[#FFF5F8] text-[#9D174D] hover:bg-pink-100'
          "
          @click="selectCategory(cat.slug)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="flex items-center justify-between mb-5 text-xs sm:text-sm text-stone-500">
      <p>
        Menampilkan <strong class="text-[#292524]">{{ products.length }}</strong> menu
        <span v-if="searchQuery"> untuk pencarian "{{ searchQuery }}"</span>
      </p>
      <button
        v-if="activeCategory !== 'semua' || searchQuery"
        type="button"
        class="text-[#EC4899] font-semibold hover:underline cursor-pointer"
        @click="clearFilters"
      >
        Reset Filter
      </button>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div v-for="i in 8" :key="i" class="h-80 rounded-2xl bg-pink-100/50 animate-pulse" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-10 rounded-2xl bg-red-50 border border-red-200 text-center">
      <p class="font-bold text-red-800">Gagal memuat katalog menu.</p>
      <p class="text-sm text-red-600 mt-1">Pastikan koneksi server berjalan dengan baik lalu coba lagi.</p>
      <button
        type="button"
        class="mt-4 px-5 py-2.5 rounded-xl bg-[#E11D48] text-white text-sm font-bold cursor-pointer"
        @click="refresh()"
      >
        Muat Ulang Menu
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="products.length === 0"
      class="p-12 rounded-2xl bg-white border border-pink-100 text-center space-y-3"
    >
      <p class="font-display font-bold text-lg text-[#292524]">Menu tidak ditemukan</p>
      <p class="text-sm text-stone-500">
        Coba gunakan kata kunci lain atau pilih kategori "Semua" untuk melihat seluruh hidangan kami.
      </p>
      <button
        type="button"
        class="px-5 py-2.5 rounded-xl bg-[#EC4899] text-white text-sm font-bold cursor-pointer"
        @click="clearFilters"
      >
        Tampilkan Semua Menu
      </button>
    </div>

    <!-- Product Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </div>
</template>
