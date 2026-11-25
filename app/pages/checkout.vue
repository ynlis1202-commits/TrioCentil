<script setup lang="ts">
import {
  Utensils,
  ShoppingBag,
  Truck,
  Banknote,
  Building2,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-vue-next'
import type { OrderType, PaymentMethod } from '~~/shared/types'
import { formatRupiah } from '~~/shared/utils/format'

useHead({ title: 'Checkout Pesanan' })

const cart = useCartStore()
const auth = useAuthStore()
const storefront = useStorefrontStore()
const toast = useToast()

const form = reactive({
  customerName: auth.user?.name || '',
  customerWhatsapp: auth.user?.phone || '',
  orderType: 'DELIVERY' as OrderType,
  deliveryAddress: '',
  tableNumber: '',
  notes: cart.orderNotes || '',
  paymentMethod: 'CASH' as PaymentMethod
})

watch(
  () => auth.user,
  (u) => {
    if (u && !form.customerName) form.customerName = u.name
    if (u?.phone && !form.customerWhatsapp) form.customerWhatsapp = u.phone
  },
  { immediate: true }
)

const submitting = ref(false)
const submitError = ref('')
const proofFile = ref<File | null>(null)
const proofPreviewUrl = ref<string | null>(null)
const proofSenderNote = ref('')

function handleCheckoutProofFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'Ukuran foto maksimal 10 MB', color: 'error' })
    return
  }
  proofFile.value = file
  proofPreviewUrl.value = URL.createObjectURL(file)
}

async function compressCheckoutProof(file: File): Promise<Blob> {
  if (!import.meta.client) return file
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const maxDim = 1200
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(file)
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.82)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }
    img.src = objectUrl
  })
}

const baseDeliveryFee = computed(() => Number(storefront.settings.delivery_fee || 10000))
const freeDeliveryMin = computed(() => Number(storefront.settings.free_delivery_min || 75000))
const qrisEnabled = computed(() => storefront.settings.qris_enabled === 'true')

const deliveryFee = computed(() => {
  if (form.orderType !== 'DELIVERY') return 0
  if (freeDeliveryMin.value > 0 && cart.subtotal >= freeDeliveryMin.value) return 0
  return baseDeliveryFee.value
})

const grandTotal = computed(() =>
  Math.max(0, cart.subtotal + deliveryFee.value - cart.discountAmount)
)

const orderTypeOptions: Array<{ value: OrderType; label: string; desc: string; icon: any }> = [
  { value: 'DELIVERY', label: 'Pesan Antar', desc: 'Diantar langsung ke alamatmu', icon: Truck },
  { value: 'TAKEAWAY', label: 'Ambil Sendiri', desc: 'Ambil langsung di warung', icon: ShoppingBag },
  { value: 'DINE_IN', label: 'Makan di Tempat', desc: 'Sajian hangat di meja warung', icon: Utensils }
]

const paymentOptions = computed(() => {
  const list: Array<{ value: PaymentMethod; label: string; desc: string; icon: any }> = [
    {
      value: 'CASH',
      label: 'Tunai saat Pesanan Diterima',
      desc: 'Bayar langsung ke kasir atau kurir saat pesanan tiba.',
      icon: Banknote
    },
    {
      value: 'BANK_TRANSFER',
      label: `Transfer Bank (${storefront.settings.bank_name})`,
      desc: `No. Rek ${storefront.settings.bank_account_number} a.n. ${storefront.settings.bank_account_holder}`,
      icon: Building2
    }
  ]

  if (qrisEnabled.value) {
    list.push({
      value: 'QRIS',
      label: 'QRIS',
      desc: `Scan QRIS merchant ${storefront.settings.qris_merchant_name}`,
      icon: QrCode
    })
  }
  return list
})

async function submitOrder() {
  submitError.value = ''

  if (cart.items.length === 0) {
    submitError.value = 'Keranjang belanja masih kosong.'
    return
  }

  if (form.customerName.trim().length < 2) {
    submitError.value = 'Mohon isi nama lengkap Anda.'
    return
  }

  if (form.customerWhatsapp.replace(/\D/g, '').length < 9) {
    submitError.value = 'Mohon isi nomor WhatsApp yang aktif (minimal 9 digit).'
    return
  }

  if (form.orderType === 'DELIVERY' && form.deliveryAddress.trim().length < 10) {
    submitError.value = 'Mohon isi alamat pengiriman lengkap (minimal 10 karakter).'
    return
  }

  submitting.value = true
  try {
    const res = await $fetch<{
      data: {
        order: { orderNumber: string }
        whatsappUrl: string
      }
    }>('/api/orders', {
      method: 'POST',
      body: {
        customerName: form.customerName.trim(),
        customerWhatsapp: form.customerWhatsapp.trim(),
        orderType: form.orderType,
        deliveryAddress: form.orderType === 'DELIVERY' ? form.deliveryAddress.trim() : undefined,
        tableNumber: form.orderType === 'DINE_IN' ? form.tableNumber.trim() : undefined,
        notes: form.notes.trim() || undefined,
        paymentMethod: form.paymentMethod,
        promoCode: cart.appliedPromo?.code || undefined,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          spicyLevel: item.spicyLevel,
          extraSambalName: item.extraSambal?.name,
          variantIds: (item.selectedVariants || []).map((v) => v.id),
          itemNotes: item.itemNotes
        }))
      }
    })

    // Jika pelanggan sudah melampirkan bukti pembayaran saat checkout, unggah otomatis sekarang
    if (proofFile.value && (form.paymentMethod === 'BANK_TRANSFER' || form.paymentMethod === 'QRIS')) {
      try {
        const compressed = await compressCheckoutProof(proofFile.value)
        const fd = new FormData()
        fd.append('file', compressed, 'bukti-pembayaran.jpg')
        if (proofSenderNote.value.trim()) {
          fd.append('senderNote', proofSenderNote.value.trim())
        }
        await $fetch(`/api/orders/${res.data.order.orderNumber}/payment-proof`, {
          method: 'POST',
          body: fd
        })
      } catch {
        // Tetap lanjut ke halaman pesanan agar user bisa unggah ulang jika gagal
      }
    }

    cart.clearCart()
    toast.add({
      title: 'Pesanan Berhasil Dibuat!',
      description: `Nomor pesanan ${res.data.order.orderNumber} berhasil dicatat.`,
      color: 'success'
    })

    await navigateTo(`/pesanan/${res.data.order.orderNumber}?created=1`)
  } catch (err: any) {
    submitError.value =
      err?.data?.statusMessage || 'Gagal memproses pesanan. Mohon periksa kembali data Anda.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <NuxtLink
      to="/keranjang"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-[#EC4899] mb-6"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Kembali ke Keranjang</span>
    </NuxtLink>

    <div class="mb-8">
      <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Langkah Terakhir</span>
      <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#292524] mt-1">
        Checkout Pesanan
      </h1>
    </div>

    <div
      v-if="cart.items.length === 0"
      class="p-10 rounded-3xl bg-white border border-pink-100 text-center max-w-lg mx-auto"
    >
      <p class="font-bold text-lg text-[#292524]">Belum ada menu di keranjang</p>
      <NuxtLink
        to="/menu"
        class="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-[#EC4899] text-white text-sm font-bold"
      >
        Pilih Menu Sekarang
      </NuxtLink>
    </div>

    <form v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" @submit.prevent="submitOrder">
      <!-- Left Form -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Error Alert -->
        <div
          v-if="submitError"
          class="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm"
        >
          <AlertCircle class="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
          <span>{{ submitError }}</span>
        </div>

        <!-- 1. Data Pelanggan -->
        <div class="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 class="font-display font-bold text-base text-[#9D174D]">1. Data Pemesan</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="cust-name" class="block text-xs font-bold text-stone-700 mb-1.5">
                Nama Lengkap <span class="text-[#E11D48]">*</span>
              </label>
              <input
                id="cust-name"
                v-model="form.customerName"
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] focus:ring-2 focus:ring-pink-100 outline-none text-sm"
              >
            </div>
            <div>
              <label for="cust-wa" class="block text-xs font-bold text-stone-700 mb-1.5">
                Nomor WhatsApp Aktif <span class="text-[#E11D48]">*</span>
              </label>
              <input
                id="cust-wa"
                v-model="form.customerWhatsapp"
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] focus:ring-2 focus:ring-pink-100 outline-none text-sm"
              >
            </div>
          </div>
        </div>

        <!-- 2. Metode Pengambilan -->
        <div class="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 class="font-display font-bold text-base text-[#9D174D]">2. Pilihan Pengambilan</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              v-for="opt in orderTypeOptions"
              :key="opt.value"
              type="button"
              class="p-4 rounded-2xl border text-left transition-all cursor-pointer"
              :class="
                form.orderType === opt.value
                  ? 'bg-[#FFF5F8] border-[#EC4899] ring-1 ring-[#EC4899]'
                  : 'bg-white border-stone-200 hover:border-pink-200'
              "
              @click="form.orderType = opt.value"
            >
              <component
                :is="opt.icon"
                class="w-5 h-5 mb-2"
                :class="form.orderType === opt.value ? 'text-[#EC4899]' : 'text-stone-400'"
              />
              <p class="font-bold text-sm text-[#292524]">{{ opt.label }}</p>
              <p class="text-[11px] text-stone-500 mt-0.5">{{ opt.desc }}</p>
            </button>
          </div>

          <!-- Conditional Address for Delivery -->
          <div v-if="form.orderType === 'DELIVERY'" class="pt-2 space-y-2">
            <label for="delivery-address" class="block text-xs font-bold text-stone-700">
              Alamat Pengiriman Lengkap <span class="text-[#E11D48]">*</span>
            </label>
            <textarea
              id="delivery-address"
              v-model="form.deliveryAddress"
              rows="3"
              required
              placeholder="Nama jalan, nomor rumah/gedung, patokan terdekat, kelurahan/kecamatan..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <p class="text-xs text-stone-500">
              Ongkir standar {{ formatRupiah(baseDeliveryFee) }}.
              <span v-if="freeDeliveryMin > 0" class="text-emerald-700 font-semibold">
                Gratis ongkir untuk belanja minimal {{ formatRupiah(freeDeliveryMin) }}!
              </span>
            </p>
          </div>

          <!-- Optional Table Number for Dine In -->
          <div v-if="form.orderType === 'DINE_IN'" class="pt-2">
            <label for="table-num" class="block text-xs font-bold text-stone-700 mb-1.5">
              Nomor Meja (Opsional)
            </label>
            <input
              id="table-num"
              v-model="form.tableNumber"
              type="text"
              placeholder="Contoh: Meja 05"
              class="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm"
            >
          </div>

          <!-- Additional Notes -->
          <div class="pt-1">
            <label for="extra-notes" class="block text-xs font-bold text-stone-700 mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              id="extra-notes"
              v-model="form.notes"
              rows="2"
              placeholder="Contoh: Tolong antar sebelum jam 13.00, bumbu kacang ekstra..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm resize-none"
            />
          </div>
        </div>

        <!-- 3. Metode Pembayaran -->
        <div class="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 class="font-display font-bold text-base text-[#9D174D]">3. Metode Pembayaran</h2>
          <div class="space-y-3">
            <button
              v-for="pay in paymentOptions"
              :key="pay.value"
              type="button"
              class="w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer"
              :class="
                form.paymentMethod === pay.value
                  ? 'bg-[#FFF5F8] border-[#EC4899] ring-1 ring-[#EC4899]'
                  : 'bg-white border-stone-200 hover:border-pink-200'
              "
              @click="form.paymentMethod = pay.value"
            >
              <component
                :is="pay.icon"
                class="w-5 h-5 shrink-0 mt-0.5"
                :class="form.paymentMethod === pay.value ? 'text-[#EC4899]' : 'text-stone-400'"
              />
              <div>
                <p class="font-bold text-sm text-[#292524]">{{ pay.label }}</p>
                <p class="text-xs text-stone-500 mt-0.5">{{ pay.desc }}</p>
              </div>
            </button>
          </div>

          <!-- Optional Payment Proof Upload directly at Checkout for Bank Transfer / QRIS -->
          <div
            v-if="form.paymentMethod === 'BANK_TRANSFER' || form.paymentMethod === 'QRIS'"
            class="mt-4 p-4 rounded-2xl bg-[#FFF5F8] border border-pink-200 space-y-3"
          >
            <div class="flex items-center gap-2 text-xs font-bold text-[#9D174D]">
              <ImageIcon class="w-4 h-4 text-[#EC4899]" />
              <span>Unggah Bukti Pembayaran (Opsional — bisa juga setelah checkout)</span>
            </div>

            <div v-if="form.paymentMethod === 'BANK_TRANSFER'" class="p-3 rounded-xl bg-white border border-pink-100 text-xs space-y-0.5">
              <p class="font-bold text-[#9D174D]">{{ storefront.settings.bank_name }}</p>
              <p class="font-mono font-extrabold text-sm text-[#292524]">{{ storefront.settings.bank_account_number }}</p>
              <p class="text-stone-500">a.n. {{ storefront.settings.bank_account_holder }}</p>
            </div>

            <input
              v-model="proofSenderNote"
              type="text"
              maxlength="100"
              placeholder="Nama pengirim / catatan transfer (opsional)"
              class="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:border-[#EC4899] outline-none text-xs"
            >

            <div v-if="proofPreviewUrl" class="relative rounded-xl overflow-hidden border border-pink-200 bg-white max-w-xs">
              <img :src="proofPreviewUrl" alt="Preview Bukti Bayar" class="w-full max-h-44 object-contain">
              <button
                type="button"
                class="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                @click="proofFile = null; proofPreviewUrl = null"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-[#9D174D] text-xs font-bold cursor-pointer transition-colors">
              <Upload class="w-4 h-4 text-[#EC4899]" />
              <span>{{ proofFile ? 'Ganti Foto Bukti Pembayaran' : 'Pilih Foto Bukti Pembayaran (JPG/PNG)' }}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleCheckoutProofFile">
            </label>
          </div>
        </div>
      </div>

      <!-- Right Order Summary -->
      <aside class="lg:col-span-5 bg-white rounded-2xl border border-pink-100 p-6 shadow-sm sticky top-24 space-y-5">
        <h2 class="font-display font-bold text-lg text-[#292524]">Ringkasan Pesanan</h2>

        <div class="divide-y divide-pink-50 max-h-72 overflow-y-auto pr-1">
          <div
            v-for="item in cart.items"
            :key="item.key"
            class="py-3 flex items-start justify-between gap-3 text-sm"
          >
            <div>
              <p class="font-bold text-[#292524]">
                {{ item.quantity }}x {{ item.name }}
              </p>
              <p v-if="item.spicyLevel" class="text-xs text-stone-500">
                Pedas: {{ item.spicyLevel }}
              </p>
              <p v-if="item.extraSambal && item.extraSambal.name !== 'Tanpa Tambahan'" class="text-xs text-stone-500">
                + {{ item.extraSambal.name }}
              </p>
              <p v-if="item.itemNotes" class="text-xs text-stone-400 italic">
                "{{ item.itemNotes }}"
              </p>
            </div>
            <span class="font-bold text-[#9D174D] whitespace-nowrap">
              {{ formatRupiah(item.unitPrice * item.quantity) }}
            </span>
          </div>
        </div>

        <div class="space-y-2.5 pt-4 border-t border-pink-100 text-sm">
          <div class="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span class="font-semibold text-[#292524]">{{ formatRupiah(cart.subtotal) }}</span>
          </div>
          <div v-if="form.orderType === 'DELIVERY'" class="flex justify-between text-stone-600">
            <span>Ongkos Kirim</span>
            <span class="font-semibold" :class="deliveryFee === 0 ? 'text-emerald-600' : 'text-[#292524]'">
              {{ deliveryFee === 0 ? 'GRATIS' : formatRupiah(deliveryFee) }}
            </span>
          </div>
          <div v-if="cart.discountAmount > 0" class="flex justify-between text-emerald-700">
            <span>Promo ({{ cart.appliedPromo?.code }})</span>
            <span class="font-bold">-{{ formatRupiah(cart.discountAmount) }}</span>
          </div>
          <div class="flex justify-between items-baseline pt-3 border-t border-pink-100">
            <span class="font-display font-bold text-base text-[#292524]">Total Pembayaran</span>
            <span class="font-display font-extrabold text-2xl text-[#9D174D]">
              {{ formatRupiah(grandTotal) }}
            </span>
          </div>
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-60 text-white font-bold text-base shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
        >
          <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
          <span>{{ submitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang' }}</span>
        </button>

        <div class="flex items-start gap-2 text-xs text-stone-500 bg-[#FFF5F8] p-3 rounded-xl">
          <ShieldCheck class="w-4 h-4 text-[#EC4899] shrink-0 mt-0.5" />
          <span>
            Seluruh harga & promo dihitung aman di server. Setelah dibuat, Anda dapat mengirim rincian pesanan ke WhatsApp Warung Makan TrioCentil untuk konfirmasi.
          </span>
        </div>
      </aside>
    </form>
  </div>
</template>
