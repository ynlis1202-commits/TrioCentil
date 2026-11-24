<script setup lang="ts">
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-vue-next'
import type { PromotionDTO, DiscountType } from '~~/shared/types'
import { formatRupiah, formatDateJakarta } from '~~/shared/utils/format'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Kelola Promo - Admin' })

const toast = useToast()
const { data: res, refresh } = await useFetch<{ data: PromotionDTO[] }>('/api/admin/promotions')
const promos = computed(() => res.value?.data || [])

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  code: '',
  title: '',
  description: '',
  discountType: 'PERCENTAGE' as DiscountType,
  discountValue: 10,
  minOrderAmount: 30000,
  maxDiscount: 15000 as number | string,
  usageLimit: 100 as number | string,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  badgeText: 'DISKON SPESIAL',
  isActive: true
})

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 30000,
    maxDiscount: 15000,
    usageLimit: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    badgeText: 'PROMO',
    isActive: true
  })
  showModal.value = true
}

function openEdit(promo: PromotionDTO) {
  editingId.value = promo.id
  Object.assign(form, {
    code: promo.code,
    title: promo.title,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    minOrderAmount: promo.minOrderAmount,
    maxDiscount: promo.maxDiscount ?? '',
    usageLimit: promo.usageLimit ?? '',
    startDate: promo.startDate.slice(0, 10),
    endDate: promo.endDate.slice(0, 10),
    badgeText: promo.badgeText || '',
    isActive: promo.isActive
  })
  showModal.value = true
}

async function savePromo() {
  saving.value = true
  try {
    const payload = {
      code: form.code,
      title: form.title,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      badgeText: form.badgeText || null,
      isActive: form.isActive
    }

    if (editingId.value) {
      await $fetch(`/api/admin/promotions/${editingId.value}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Promo diperbarui!', color: 'success' })
    } else {
      await $fetch('/api/admin/promotions', { method: 'POST', body: payload })
      toast.add({ title: 'Promo baru ditambahkan!', color: 'success' })
    }
    showModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal menyimpan promo',
      description: err?.data?.statusMessage || 'Periksa input promo.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function deletePromo(promo: PromotionDTO) {
  if (!confirm(`Hapus kode promo "${promo.code}"?`)) return
  await $fetch(`/api/admin/promotions/${promo.id}`, { method: 'DELETE' })
  toast.add({ title: 'Promo dihapus.', color: 'success' })
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Manajemen Promo</h2>
        <p class="text-xs sm:text-sm text-stone-500">Buat kode voucher diskon persentase atau potongan harga langsung.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-sm font-bold cursor-pointer self-start"
        @click="openCreate"
      >
        <Plus class="w-4 h-4" />
        Tambah Promo
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="promo in promos"
        :key="promo.id"
        class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFF5F8] border border-pink-200 font-mono font-extrabold text-xs text-[#9D174D]">
              <Tag class="w-3.5 h-3.5 text-[#EC4899]" />
              {{ promo.code }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="promo.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'"
            >
              {{ promo.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
          <h3 class="font-display font-bold text-base text-[#292524]">{{ promo.title }}</h3>
          <p class="text-xs text-stone-500">{{ promo.description }}</p>
          <div class="text-xs text-stone-600 pt-1 space-y-0.5">
            <p>
              <strong>Diskon:</strong>
              {{ promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatRupiah(promo.discountValue) }}
            </p>
            <p><strong>Min. Order:</strong> {{ formatRupiah(promo.minOrderAmount) }}</p>
            <p><strong>Terpakai:</strong> {{ promo.usedCount }} / {{ promo.usageLimit ?? '∞' }}</p>
            <p class="text-[11px] text-stone-400">
              Berlaku: {{ formatDateJakarta(promo.startDate, false) }} - {{ formatDateJakarta(promo.endDate, false) }}
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-stone-100">
          <button type="button" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-50 text-[#9D174D] text-xs font-bold cursor-pointer" @click="openEdit(promo)">
            <Pencil class="w-3.5 h-3.5" /> Edit
          </button>
          <button type="button" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-[#E11D48] text-xs font-bold cursor-pointer" @click="deletePromo(promo)">
            <Trash2 class="w-3.5 h-3.5" /> Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 class="font-display font-bold text-lg text-[#292524]">
            {{ editingId ? 'Edit Promo' : 'Buat Promo Baru' }}
          </h3>
          <button type="button" class="p-1 text-stone-400 cursor-pointer" @click="showModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form class="p-6 space-y-4" @submit.prevent="savePromo">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Kode Promo *</label>
              <input v-model="form.code" type="text" required class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm uppercase">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Badge</label>
              <input v-model="form.badgeText" type="text" placeholder="DISKON 10%" class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Judul Promo *</label>
            <input v-model="form.title" type="text" required class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-700 mb-1">Deskripsi *</label>
            <textarea v-model="form.description" rows="2" required class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Tipe Diskon</label>
              <select v-model="form.discountType" class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white">
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Potongan Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Nilai Diskon *</label>
              <input v-model.number="form.discountValue" type="number" min="1" required class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Min. Belanja</label>
              <input v-model.number="form.minOrderAmount" type="number" min="0" class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Maks. Diskon</label>
              <input v-model="form.maxDiscount" type="number" min="0" class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Kuota</label>
              <input v-model="form.usageLimit" type="number" min="1" class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Tanggal Mulai *</label>
              <input v-model="form.startDate" type="date" required class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">Tanggal Berakhir *</label>
              <input v-model="form.endDate" type="date" required class="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
            </div>
          </div>
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input v-model="form.isActive" type="checkbox">
            Aktifkan promo ini
          </label>
          <div class="pt-3 border-t border-stone-100 flex justify-end gap-2">
            <button type="button" class="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer" @click="showModal = false">Batal</button>
            <button type="submit" :disabled="saving" class="px-5 py-2 rounded-xl bg-[#EC4899] text-white text-xs font-bold cursor-pointer">
              {{ saving ? 'Menyimpan...' : 'Simpan Promo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
