<script setup lang="ts">
import { Save, Loader2, Eye, EyeOff, Lock } from 'lucide-vue-next'
import type { PublicStoreSettings } from '~~/shared/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})
useHead({ title: 'Pengaturan Warung - Admin' })

const toast = useToast()
const { data: res, refresh } = await useFetch<{ data: PublicStoreSettings }>('/api/admin/settings')

const form = reactive<Record<string, string>>({
  store_name: 'Warung Makan TrioCentil',
  store_tagline: 'Rasa Nikmat, Harga Bersahabat, Bikin Nagih!',
  store_address: '',
  store_phone: '',
  store_whatsapp: '',
  store_hours_weekday: '',
  store_hours_weekend: '',
  store_is_open: 'true',
  delivery_fee: '10000',
  free_delivery_min: '75000',
  bank_name: 'Bank BCA',
  bank_account_number: '',
  bank_account_holder: '',
  qris_enabled: 'true',
  qris_merchant_name: 'WARUNG MAKAN TRIOCENTIL',
  cashier_payment_pin: '123456',
  store_maps_url: ''
})

const showPin = ref(false)

watch(
  () => res.value?.data,
  (val) => {
    if (val) Object.assign(form, val)
  },
  { immediate: true }
)

const saving = ref(false)

async function saveSettings() {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { ...form }
    })
    toast.add({ title: 'Pengaturan warung berhasil disimpan!', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Gagal menyimpan pengaturan', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-6 max-w-4xl" @submit.prevent="saveSettings">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display font-extrabold text-2xl text-[#292524]">Pengaturan Warung</h2>
        <p class="text-xs sm:text-sm text-stone-500">
          Kelola informasi warung, jam buka, tarif ongkos kirim, rekening bank, dan konfigurasi QRIS.
        </p>
      </div>
      <button
        type="submit"
        :disabled="saving"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-sm font-bold cursor-pointer self-start disabled:opacity-60"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <Save v-else class="w-4 h-4" />
        <span>{{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}</span>
      </button>
    </div>

    <!-- Identitas & Operasional -->
    <section class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <h3 class="font-display font-bold text-base text-[#9D174D]">Identitas & Jam Operasional</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Nama Warung</label>
          <input v-model="form.store_name" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Status Pemesanan Online</label>
          <select v-model="form.store_is_open" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm bg-white">
            <option value="true">Buka (Menerima Pesanan)</option>
            <option value="false">Tutup Sementara</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-stone-700 mb-1">Tagline</label>
        <input v-model="form.store_tagline" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
      </div>
      <div>
        <label class="block text-xs font-bold text-stone-700 mb-1">Alamat Lengkap</label>
        <textarea v-model="form.store_address" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Jam Buka Hari Kerja</label>
          <input v-model="form.store_hours_weekday" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Jam Buka Akhir Pekan</label>
          <input v-model="form.store_hours_weekend" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Telepon</label>
          <input v-model="form.store_phone" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">WhatsApp Toko (Env Override)</label>
          <input v-model="form.store_whatsapp" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">URL Google Maps</label>
          <input v-model="form.store_maps_url" type="url" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
      </div>
    </section>

    <!-- Pengiriman & Pembayaran -->
    <section class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <h3 class="font-display font-bold text-base text-[#9D174D]">Pengiriman & Metode Pembayaran</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Ongkos Kirim Standar (IDR)</label>
          <input v-model="form.delivery_fee" type="number" min="0" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Gratis Ongkir Minimal Belanja (IDR)</label>
          <input v-model="form.free_delivery_min" type="number" min="0" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Nama Bank</label>
          <input v-model="form.bank_name" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Nomor Rekening</label>
          <input v-model="form.bank_account_number" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Atas Nama</label>
          <input v-model="form.bank_account_holder" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Aktifkan QRIS</label>
          <select v-model="form.qris_enabled" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm bg-white">
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Nama Merchant QRIS</label>
          <input v-model="form.qris_merchant_name" type="text" class="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm">
        </div>
      </div>

      <!-- Keamanan PIN Kasir -->
      <div class="pt-4 border-t border-stone-100 space-y-2">
        <label class="flex items-center gap-1.5 text-xs font-bold text-[#9D174D]">
          <Lock class="w-3.5 h-3.5 text-[#EC4899]" />
          PIN Kasir Pembayaran Tunai / Bayar di Tempat (4–8 digit)
        </label>
        <div class="flex items-center gap-2 max-w-xs">
          <input
            v-model="form.cashier_payment_pin"
            :type="showPin ? 'text' : 'password'"
            inputmode="numeric"
            minlength="4"
            maxlength="8"
            required
            placeholder="Contoh: 123456"
            class="flex-1 px-3.5 py-2 rounded-xl border border-pink-200 bg-[#FFF5F8] text-sm font-mono tracking-widest outline-none focus:border-[#EC4899]"
          >
          <button
            type="button"
            class="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
            @click="showPin = !showPin"
          >
            <EyeOff v-if="showPin" class="w-4 h-4" />
            <Eye v-else class="w-4 h-4" />
          </button>
        </div>
        <p class="text-[11px] text-stone-500">
          Kasir wajib memasukkan PIN ini saat membuka dan mengubah status pembayaran untuk pesanan <strong>Tunai / Bayar di Tempat</strong>.
        </p>
      </div>
    </section>
  </form>
</template>
