<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
    light?: boolean
  }>(),
  {
    compact: false,
    light: false
  }
)
</script>

<template>
  <div class="inline-flex items-center gap-2.5 select-none">
    <!-- Logo TrioCentil: Sate Ayam + Nasi + Minuman Es dalam palet Pink Soft -->
    <div
      class="relative flex items-center justify-center rounded-2xl shadow-sm shrink-0 overflow-hidden"
      :class="compact ? 'w-9 h-9 bg-[#F472B6]' : 'w-11 h-11 bg-gradient-to-br from-[#F472B6] to-[#EC4899]'"
    >
      <svg viewBox="0 0 64 64" fill="none" class="w-full h-full p-1" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="#FFF5F8" />
        <!-- Tusuk Sate Ayam -->
        <line x1="13" y1="45" x2="47" y2="12" stroke="#9D174D" stroke-width="2.8" stroke-linecap="round" />
        <ellipse cx="24" cy="34" rx="4.5" ry="3.2" transform="rotate(-45 24 34)" fill="#EC4899" />
        <ellipse cx="31.5" cy="26.5" rx="4.5" ry="3.2" transform="rotate(-45 31.5 26.5)" fill="#F472B6" />
        <ellipse cx="39" cy="19" rx="4.5" ry="3.2" transform="rotate(-45 39 19)" fill="#DB2777" />
        <!-- Mangkuk Nasi Hangat -->
        <path d="M15 44C15 39.8 20 37 27 37C34 37 39 39.8 39 44H15Z" fill="#FFFFFF" stroke="#9D174D" stroke-width="1.7" />
        <path d="M14 44H40C39 49.5 34.5 53 27 53C19.5 53 15 49.5 14 44Z" fill="#9D174D" />
        <circle cx="24" cy="41" r="1" fill="#F472B6" />
        <circle cx="30" cy="40.5" r="1" fill="#F472B6" />
        <!-- Gelas Minuman Es -->
        <path d="M43 32H54L52.3 50.5H44.7L43 32Z" fill="#FBCFE8" stroke="#9D174D" stroke-width="1.7" stroke-linejoin="round" />
        <rect x="46" y="36" width="3.5" height="3.5" rx="0.8" fill="#FFFFFF" />
        <rect x="48.5" y="41" width="3.2" height="3.2" rx="0.8" fill="#FFFFFF" />
        <line x1="49" y1="26" x2="50.5" y2="33" stroke="#EC4899" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>

    <div v-if="!compact" class="leading-tight">
      <span
        class="block font-display font-extrabold tracking-tight text-lg"
        :class="light ? 'text-white' : 'text-[#292524]'"
      >
        Trio<span :class="light ? 'text-[#F9A8D4]' : 'text-[#EC4899]'">Centil</span>
      </span>
      <span
        class="block text-[10px] font-bold tracking-[0.14em] uppercase"
        :class="light ? 'text-pink-200/80' : 'text-[#F472B6]'"
      >
        WARUNG MAKAN
      </span>
    </div>
  </div>
</template>
