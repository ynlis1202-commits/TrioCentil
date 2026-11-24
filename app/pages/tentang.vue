<script setup lang="ts">
import { Flame, HeartHandshake, Award, UtensilsCrossed, ArrowRight } from 'lucide-vue-next'

useHead({ title: 'Tentang Kami' })
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <div class="space-y-5">
        <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Cerita Kami</span>
        <h1 class="font-display font-extrabold text-3xl sm:text-4xl text-[#292524] leading-tight">
          Warung Makan <span class="text-[#EC4899]">TrioCentil</span> — Hangat di Hati, Nikmat di Lidah
        </h1>
        <p class="text-stone-600 leading-relaxed text-sm sm:text-base">
          Lahir dari kecintaan terhadap kuliner Nusantara, Warung Makan TrioCentil menyajikan sate ayam bakar arang dengan racikan bumbu kacang turun-temurun yang kental, gurih, dan manis pas di lidah.
        </p>
        <p class="text-stone-600 leading-relaxed text-sm sm:text-base">
          Dipadukan dengan nasi putih pulen hangat, lontong daun pisang lembut, beragam makanan pendamping, serta aneka minuman es segar, kami hadir dengan tagline <strong>"Rasa Nikmat, Harga Bersahabat, Bikin Nagih!"</strong>.
        </p>
        <NuxtLink
          to="/menu"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-sm transition-colors"
        >
          <span>Lihat Menu Kami</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div class="rounded-3xl overflow-hidden shadow-xl border-4 border-white">
        <img
          src="/images/hero-sate.jpg"
          alt="Sajian Sate Ayam Warung Makan TrioCentil"
          class="w-full aspect-[4/3] object-cover"
        >
      </div>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white border border-pink-100 shadow-xs space-y-3">
        <Flame class="w-8 h-8 text-[#EC4899]" />
        <h2 class="font-display font-bold text-lg text-[#9D174D]">Selalu Dibakar Dadakan</h2>
        <p class="text-sm text-stone-600 leading-relaxed">
          Pesanan Anda baru kami bakar saat dikonfirmasi agar aroma arang dan tekstur empuk daging ayam tetap terjaga sempurna.
        </p>
      </div>
      <div class="p-6 rounded-2xl bg-white border border-pink-100 shadow-xs space-y-3">
        <Award class="w-8 h-8 text-[#E11D48]" />
        <h2 class="font-display font-bold text-lg text-[#9D174D]">Bahan Baku Terjamin</h2>
        <p class="text-sm text-stone-600 leading-relaxed">
          Kami memilih daging ayam segar, kacang tanah pilihan, kecap berkualitas, dan buah jeruk asli tanpa pemanis buatan.
        </p>
      </div>
      <div class="p-6 rounded-2xl bg-white border border-pink-100 shadow-xs space-y-3">
        <HeartHandshake class="w-8 h-8 text-[#EC4899]" />
        <h2 class="font-display font-bold text-lg text-[#9D174D]">Pelayanan Ramah & Cepat</h2>
        <p class="text-sm text-stone-600 leading-relaxed">
          Pemesanan online terintegrasi dengan pelacakan status dan WhatsApp untuk memastikan kenyamanan pelanggan setiap saat.
        </p>
      </div>
    </section>

    <section class="rounded-3xl bg-[#9D174D] text-white p-8 sm:p-12 text-center space-y-4">
      <UtensilsCrossed class="w-10 h-10 text-pink-300 mx-auto" />
      <h2 class="font-display font-extrabold text-2xl sm:text-3xl">
        Siap Menikmati Sate Ayam Terbaik Hari Ini?
      </h2>
      <p class="text-pink-100 text-sm sm:text-base max-w-xl mx-auto">
        Pesan untuk makan di tempat, ambil sendiri, atau antar langsung ke rumah & kantor Anda.
      </p>
      <NuxtLink
        to="/menu"
        class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-sm"
      >
        Pesan Sekarang
      </NuxtLink>
    </section>
  </div>
</template>
