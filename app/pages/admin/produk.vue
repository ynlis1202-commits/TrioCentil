<script setup lang="ts">
import { Plus, Pencil, Trash2, Upload, Search, X, Loader2 } from 'lucide-vue-next'
import type { CategoryDTO, ProductDTO } from '~~/shared/types'
import { formatRupiah } from '~~/shared/utils/format'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Kelola Produk - Admin' })

const toast = useToast()
const search = ref('')
const filterCategory = ref('')

const { data: catRes } = await useFetch<{ data: CategoryDTO[] }>('/api/admin/categories')
const { data: prodRes, pending, refresh } = await useFetch<{ data: ProductDTO[] }>('/api/admin/products', {
  query: computed(() => ({
    search: search.value.trim() || undefined,
    categoryId: filterCategory.value || undefined
  }))
})

const categories = computed(() => catRes.value?.data || [])
const products = computed(() => prodRes.value?.data || [])

// Modal form state
const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)

const form = reactive({
  name: '',
  categoryId: '',
  price: 20000,
  comparePrice: '' as string | number,
  stock: 100,
  preparationTime: 15,
  shortDescription: '',
  description: '',
  imageUrl: '/images/sate-original.jpg',
  isAvailable: true,
  isFeatured: false,
  isBestSeller: false,
  spicyOptionsText: 'Tidak Pedas, Sedang, Pedas, Extra Pedas'
})

function openCreateModal() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    categoryId: categories.value[0]?.id || '',
    price: 22000,
    comparePrice: '',
    stock: 100,
    preparationTime: 12,
    shortDescription: '',
    description: '',
    imageUrl: '/images/sate-original.jpg',
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spicyOptionsText: 'Tidak Pedas, Sedang, Pedas, Extra Pedas'
  })
  showModal.value = true
}

function openEditModal(product: ProductDTO) {
  editingId.value = product.id
  Object.assign(form, {
    name: product.name,
    categoryId: product.categoryId,
    price: product.price,
    comparePrice: product.comparePrice ?? '',
    stock: product.stock,
    preparationTime: product.preparationTime,
    shortDescription: product.shortDescription || '',
    description: product.description,
    imageUrl: product.images[0]?.url || '/images/sate-original.jpg',
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    spicyOptionsText: (product.spicyOptions || []).join(', ')
  })
  showModal.value = true
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ data: { url: string } }>('/api/admin/upload', {
      method: 'POST',
      body: fd
    })
    form.imageUrl = res.data.url
    toast.add({ title: 'Foto berhasil diunggah!', color: 'success' })
  } catch (err: any) {
    toast.add({
      title: 'Gagal mengunggah foto',
      description: err?.data?.statusMessage || 'Pastikan format PNG/JPG/WEBP maks 5MB.',
      color: 'error'
    })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function saveProduct() {
  saving.value = true
  try {
    const spicyOptions = form.spicyOptionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock: Number(form.stock),
      preparationTime: Number(form.preparationTime),
      shortDescription: form.shortDescription || null,
      description: form.description,
      imageUrl: form.imageUrl || null,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      spicyOptions
    }

    if (editingId.value) {
      await $fetch(`/api/admin/products/${editingId.value}`, {
        method: 'PATCH',
        body: payload
      })
      toast.add({ title: 'Produk berhasil diperbarui!', color: 'success' })
    } else {
      await $fetch('/api/admin/products', {
        method: 'POST',
        body: payload
      })
      toast.add({ title: 'Produk baru berhasil ditambahkan!', color: 'success' })
    }

    showModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal menyimpan produk',
      description: err?.data?.statusMessage || 'Periksa kembali input Anda.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function toggleAvailability(product: ProductDTO) {
  try {
    await $fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      body: { isAvailable: !product.isAvailable }
    })
    await refresh()
  } catch {
    toast.add({ title: 'Gagal mengubah status produk', color: 'error' })
  }
}

async function deleteProduct(product: ProductDTO) {
  if (!confirm(`Hapus produk "${product.name}"?`)) return
  try {
    await $fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    toast.add({ title: 'Produk dihapus.', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Tidak dapat menghapus produk',
      description: err?.data?.statusMessage || 'Gagal menghapus produk.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Manajemen Produk</h2>
        <p class="text-xs sm:text-sm text-stone-500">
          Tambah, edit, hapus menu, atur harga, stok, ketersediaan, dan unggah foto makanan.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-sm font-bold cursor-pointer self-start sm:self-auto"
        @click="openCreateModal"
      >
        <Plus class="w-4 h-4" />
        Tambah Produk
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="search"
          placeholder="Cari nama produk atau SKU..."
          class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]"
        >
      </div>
      <select
        v-model="filterCategory"
        class="px-3.5 py-2 rounded-xl border border-stone-200 text-sm bg-white outline-none focus:border-[#EC4899]"
      >
        <option value="">Semua Kategori</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-stone-50 text-stone-500 font-bold uppercase text-[11px]">
            <tr>
              <th class="px-5 py-3">Produk</th>
              <th class="px-5 py-3">Kategori</th>
              <th class="px-5 py-3">Harga</th>
              <th class="px-5 py-3">Stok</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-if="pending">
              <td colspan="6" class="px-5 py-10 text-center text-stone-400">Memuat data produk...</td>
            </tr>
            <tr v-else-if="products.length === 0">
              <td colspan="6" class="px-5 py-10 text-center text-stone-400">Belum ada produk.</td>
            </tr>
            <tr v-for="prod in products" :key="prod.id" class="hover:bg-pink-50/30">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <img
                    :src="prod.images[0]?.url || '/images/sate-original.jpg'"
                    :alt="prod.name"
                    class="w-12 h-12 rounded-xl object-cover bg-pink-50 shrink-0"
                  >
                  <div>
                    <p class="font-bold text-[#292524]">{{ prod.name }}</p>
                    <div class="flex gap-1.5 mt-0.5">
                      <span v-if="prod.isBestSeller" class="px-1.5 py-0.5 rounded bg-red-100 text-[#E11D48] text-[10px] font-bold">
                        Best Seller
                      </span>
                      <span v-if="prod.isFeatured" class="px-1.5 py-0.5 rounded bg-pink-100 text-[#9D174D] text-[10px] font-bold">
                        Unggulan
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-stone-600">{{ prod.category?.name || '-' }}</td>
              <td class="px-5 py-3.5 font-bold text-[#9D174D]">{{ formatRupiah(prod.price) }}</td>
              <td class="px-5 py-3.5 font-semibold" :class="prod.stock <= 10 ? 'text-[#E11D48]' : 'text-stone-700'">
                {{ prod.stock }}
              </td>
              <td class="px-5 py-3.5">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors"
                  :class="prod.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'"
                  @click="toggleAvailability(prod)"
                >
                  {{ prod.isAvailable ? 'Tersedia' : 'Nonaktif' }}
                </button>
              </td>
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="p-2 rounded-lg text-stone-500 hover:bg-pink-50 hover:text-[#EC4899] cursor-pointer"
                  title="Edit Produk"
                  @click="openEditModal(prod)"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-2 rounded-lg text-stone-500 hover:bg-red-50 hover:text-[#E11D48] cursor-pointer"
                  title="Hapus Produk"
                  @click="deleteProduct(prod)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Product Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 class="font-display font-bold text-lg text-[#292524]">
            {{ editingId ? 'Edit Produk' : 'Tambah Produk Baru' }}
          </h3>
          <button type="button" class="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer" @click="showModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-4" @submit.prevent="saveProduct">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Nama Produk *</label>
              <input v-model="form.name" type="text" required class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Kategori *</label>
              <select v-model="form.categoryId" required class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm bg-white outline-none focus:border-[#EC4899]">
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Harga (IDR) *</label>
              <input v-model.number="form.price" type="number" min="500" required class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Harga Coret (Opsional)</label>
              <input v-model="form.comparePrice" type="number" min="0" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Stok *</label>
              <input v-model.number="form.stock" type="number" min="0" required class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
            </div>
          </div>

          <!-- Secure Photo Upload -->
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1.5">Foto Produk</label>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                :src="form.imageUrl || '/images/sate-original.jpg'"
                alt="Preview"
                class="w-24 h-20 rounded-xl object-cover border border-stone-200 bg-pink-50"
              >
              <div class="flex-1 space-y-2 w-full">
                <label class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF5F8] border border-pink-200 text-xs font-bold text-[#9D174D] hover:bg-pink-100 cursor-pointer">
                  <Upload class="w-4 h-4" />
                  <span>{{ uploading ? 'Mengunggah...' : 'Unggah Foto Baru (PNG/JPG/WEBP)' }}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" :disabled="uploading" @change="handleImageUpload">
                </label>
                <input
                  v-model="form.imageUrl"
                  type="text"
                  placeholder="Atau masukkan URL gambar (/images/...)"
                  class="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs outline-none focus:border-[#EC4899]"
                >
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Deskripsi Singkat</label>
            <input v-model="form.shortDescription" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
          </div>

          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Deskripsi Lengkap *</label>
            <textarea v-model="form.description" rows="3" required class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]" />
          </div>

          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Pilihan Tingkat Pedas (pisahkan koma, kosongkan jika minuman)</label>
            <input v-model="form.spicyOptionsText" type="text" placeholder="Tidak Pedas, Sedang, Pedas, Extra Pedas" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
          </div>

          <div class="flex flex-wrap gap-5 pt-1 text-xs font-semibold text-stone-700">
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input v-model="form.isAvailable" type="checkbox" class="rounded text-[#EC4899]">
              Tersedia Dijual
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input v-model="form.isBestSeller" type="checkbox" class="rounded text-[#EC4899]">
              Tandai Best Seller
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input v-model="form.isFeatured" type="checkbox" class="rounded text-[#EC4899]">
              Menu Unggulan
            </label>
          </div>

          <div class="pt-4 border-t border-stone-100 flex justify-end gap-2">
            <button type="button" class="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-bold cursor-pointer" @click="showModal = false">
              Batal
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-sm font-bold cursor-pointer disabled:opacity-60"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <span>{{ saving ? 'Menyimpan...' : 'Simpan Produk' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
