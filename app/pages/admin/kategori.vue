<script setup lang="ts">
import { Plus, Pencil, Trash2, X } from 'lucide-vue-next'
import type { CategoryDTO } from '~~/shared/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Kelola Kategori - Admin' })

const toast = useToast()
const { data: res, refresh } = await useFetch<{ data: CategoryDTO[] }>('/api/admin/categories')
const categories = computed(() => res.value?.data || [])

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  imageUrl: '/images/sate-original.jpg',
  sortOrder: 0,
  isActive: true
})

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    description: '',
    imageUrl: '/images/sate-original.jpg',
    sortOrder: categories.value.length + 1,
    isActive: true
  })
  showModal.value = true
}

function openEdit(cat: CategoryDTO) {
  editingId.value = cat.id
  Object.assign(form, {
    name: cat.name,
    description: cat.description || '',
    imageUrl: cat.imageUrl || '/images/sate-original.jpg',
    sortOrder: cat.sortOrder,
    isActive: cat.isActive
  })
  showModal.value = true
}

async function saveCategory() {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/admin/categories/${editingId.value}`, { method: 'PATCH', body: form })
      toast.add({ title: 'Kategori diperbarui!', color: 'success' })
    } else {
      await $fetch('/api/admin/categories', { method: 'POST', body: form })
      toast.add({ title: 'Kategori baru ditambahkan!', color: 'success' })
    }
    showModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal menyimpan kategori',
      description: err?.data?.statusMessage || 'Coba lagi.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function removeCategory(cat: CategoryDTO) {
  if (!confirm(`Hapus kategori "${cat.name}"?`)) return
  try {
    await $fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
    toast.add({ title: 'Kategori dihapus.', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Tidak dapat menghapus kategori',
      description: err?.data?.statusMessage || 'Kategori masih digunakan produk.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Manajemen Kategori</h2>
        <p class="text-xs sm:text-sm text-stone-500">Atur pengelompokan menu dan urutan tampil di katalog pelanggan.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-sm font-bold cursor-pointer self-start sm:self-auto"
        @click="openCreate"
      >
        <Plus class="w-4 h-4" />
        Tambah Kategori
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col"
      >
        <img
          :src="cat.imageUrl || '/images/sate-original.jpg'"
          :alt="cat.name"
          class="w-full h-36 object-cover bg-pink-50"
        >
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-display font-bold text-base text-[#292524]">{{ cat.name }}</h3>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                :class="cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'"
              >
                {{ cat.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
            <p class="text-xs text-stone-500 mt-1 line-clamp-2">{{ cat.description || 'Tanpa deskripsi' }}</p>
            <p class="text-[11px] font-semibold text-[#9D174D] mt-2">
              Urutan #{{ cat.sortOrder }} • {{ cat.productCount ?? 0 }} Produk
            </p>
          </div>
          <div class="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-50 text-[#9D174D] text-xs font-bold cursor-pointer"
              @click="openEdit(cat)"
            >
              <Pencil class="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-[#E11D48] text-xs font-bold cursor-pointer"
              @click="removeCategory(cat)"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 class="font-display font-bold text-lg text-[#292524]">
            {{ editingId ? 'Edit Kategori' : 'Tambah Kategori' }}
          </h3>
          <button type="button" class="p-1 text-stone-400 cursor-pointer" @click="showModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form class="p-6 space-y-4" @submit.prevent="saveCategory">
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Nama Kategori *</label>
            <input v-model="form.name" type="text" required class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Deskripsi</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Urutan Tampil</label>
              <input v-model.number="form.sortOrder" type="number" min="0" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">URL Gambar</label>
              <input v-model="form.imageUrl" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#EC4899]">
            </div>
          </div>
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input v-model="form.isActive" type="checkbox">
            Aktifkan kategori di toko
          </label>
          <div class="pt-3 border-t border-stone-100 flex justify-end gap-2">
            <button type="button" class="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer" @click="showModal = false">
              Batal
            </button>
            <button type="submit" :disabled="saving" class="px-5 py-2 rounded-xl bg-[#EC4899] text-white text-xs font-bold cursor-pointer">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
