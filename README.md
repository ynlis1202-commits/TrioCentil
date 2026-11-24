# Website Warung Makan TrioCentil

> **"Rasa Nikmat, Harga Bersahabat, Bikin Nagih!"**

Sistem Pemesanan Makanan Online & Manajemen Restoran lengkap untuk **Warung Makan TrioCentil** (Sate Ayam, Nasi & Lontong, Makanan Pendamping, dan Aneka Minuman Es).

---

## Fitur Utama

### Pelanggan (Storefront — Mobile-First + Desktop Responsive)
- **Beranda Interaktif**: Hero sate ayam, kategori menu, menu Best Seller, promo spesial (salin kode 1-klik), keunggulan TrioCentil, cara pemesanan, testimoni pelanggan, jam operasional, dan lokasi.
- **Katalog Menu (`/menu`)**: Pencarian real-time, filter kategori (`Semua`, `Sate Ayam`, `Nasi dan Lontong`, `Makanan Pendamping`, `Minuman Es`), sortir harga/rating/terbaru.
- **Detail Produk (`/menu/[slug]`)**: Galeri foto, pilihan jumlah, tingkat kepedasan, tambahan sambal, varian porsi/add-on, catatan khusus, dan kalkulasi harga langsung.
- **Keranjang Belanja (`/keranjang`)**: Persisten di browser, ubah jumlah, hapus item, validasi kode promo ke server, dan catatan pesanan.
- **Checkout (`/checkout`)**: Pilihan `Makan di Tempat`, `Ambil Sendiri`, atau `Pesan Antar` (alamat wajib untuk delivery, ongkir & gratis ongkir otomatis), pilihan pembayaran `Tunai`, `Transfer Bank`, dan `QRIS`. Seluruh harga dan diskon dihitung aman di server.
- **Pelacakan Pesanan & WhatsApp Order (`/pesanan` & `/pesanan/[orderNumber]`)**: Nomor pesanan otomatis (`TC-YYYYMMDD-XXXX`), timeline 7 status pesanan, pesan WhatsApp otomatis lengkap ke nomor toko (dari environment variable) tanpa mengonfirmasi pesanan secara sepihak.
- **Navigasi Bawah Mobile**: Beranda, Menu, Keranjang (dengan badge), Pesanan, dan Profil.

### Dashboard Admin (`/admin` — RBAC Protected)
1. **Dashboard (`/admin`)**: Total penjualan hari ini, total pesanan, pesanan baru, sedang diproses, produk terlaris, grafik penjualan 7/14/30 hari, riwayat pesanan terbaru, dan notifikasi internal.
2. **Produk (`/admin/produk`)**: Tambah, edit, hapus produk, ubah harga, stok, ketersediaan, serta unggah foto aman (validasi magic bytes PNG/JPG/WEBP maks 5 MB).
3. **Kategori (`/admin/kategori`)**: CRUD kategori & urutan tampil.
4. **Pesanan (`/admin/pesanan`)**: Filter 7 status, proses pesanan, ubah status beserta catatan audit (`order_status_histories`), verifikasi status pembayaran, dan chat WhatsApp pelanggan.
5. **Pelanggan (`/admin/pelanggan`)**: Direktori pelanggan, jumlah transaksi, total belanja, dan riwayat pesanan.
6. **Laporan Penjualan (`/admin/laporan`)**: Filter rentang tanggal, grafik pendapatan harian, breakdown metode pembayaran & jenis layanan, menu terlaris, dan **Ekspor CSV**.
7. **Promo (`/admin/promo`)**: CRUD kode voucher diskon persentase & nominal.
8. **Pengaturan (`/admin/pengaturan`)**: Identitas warung, status buka/tutup, jam operasional, ongkir, rekening bank, dan konfigurasi QRIS.

---

## Teknologi

- **Frontend**: Nuxt 4, Vue 3 Composition API, TypeScript, Tailwind CSS v4, Nuxt UI, Pinia, Lucide Icons
- **Backend**: Nuxt Server API (Nitro), Prisma ORM, **TiDB Cloud (MySQL-compatible Serverless)**, Zod, bcryptjs
- **Keamanan**: Cookie sesi `httpOnly` tertandatangani HMAC-SHA256, RBAC (`ADMIN`, `STAFF`, `CUSTOMER`), rate limiting, validasi Zod di server, kalkulasi harga di server, dan validasi file upload via binary magic bytes.

---

## Setup Database TiDB Cloud & Instalasi Lokal

### 1. Buat Cluster Gratis di TiDB Cloud
1. Daftar / login ke [TiDB Cloud Console](https://tidbcloud.com).
2. Klik **Create Cluster** → pilih **TiDB Cloud Starter (Serverless / Free)** → pilih region terdekat (mis. **Singapore / ap-southeast-1**).
3. Buka **SQL Editor** di TiDB Cloud Console lalu buat database:
   ```sql
   CREATE DATABASE IF NOT EXISTS warung_triocentil;
   ```
4. Klik tombol **Connect** → pilih **Prisma** → klik **Generate Password** lalu salin `DATABASE_URL` Anda (formatnya: `mysql://<USER>:<PASSWORD>@gateway01.<region>.prod.aws.tidbcloud.com:4000/warung_triocentil?sslaccept=strict`).

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin `.env.example` menjadi `.env` lalu tempel `DATABASE_URL` dari TiDB Cloud:
```bash
cp .env.example .env
```

Variabel penting di `.env`:
- `DATABASE_URL`: Connection string TiDB Cloud (pastikan berakhir dengan `?sslaccept=strict` dan mengarah ke database `warung_triocentil`)
- `SESSION_SECRET`: String acak minimal 32 karakter (wajib diganti di production)
- `STORE_WHATSAPP_NUMBER`: Nomor WhatsApp resmi toko (format `628xxxxxxxxxx`)
- `NUXT_PUBLIC_APP_URL`: URL publik website (contoh: `https://triocentil.id`)
- `QRIS_ENABLED`: `true` atau `false`

### 4. Sinkronisasi Skema Prisma & Seeding Data Awal ke TiDB Cloud
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

#### Akun Bawaan Setelah Seeding
| Role | Email | Kata Sandi |
| --- | --- | --- |
| **Admin** | `admin@triocentil.id` | `AdminTrioCentil123!` |
| **Staff / Kasir** | `kasir@triocentil.id` | `KasirTrioCentil123!` |
| **Pelanggan Demo** | `budi@contoh.id` | `Pelanggan123!` |

> Segera ganti kata sandi akun bawaan sebelum digunakan di lingkungan production.

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka `http://localhost:3000` di browser Anda.

---

## Pengujian & Verifikasi Build

```bash
# Jalankan unit test (pricing, WhatsApp formatter, Zod validation)
npm run test

# Cek tipe TypeScript
npm run typecheck

# Build production
npm run build
```

---

## Panduan Deployment Production

### Opsi A: VPS / Node.js Server (PM2 / Systemd)
1. Siapkan PostgreSQL production dan atur seluruh environment variable di server (`NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET`, `STORE_WHATSAPP_NUMBER`, `NUXT_PUBLIC_APP_URL`).
2. Jalankan migrasi & build:
   ```bash
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```
3. Jalankan server Nitro hasil build:
   ```bash
   node .output/server/index.mjs
   ```
   (Disarankan memakai PM2 atau systemd di belakang Nginx/Caddy dengan HTTPS/TLS agar cookie `Secure` aktif penuh).

### Opsi B: Docker / PaaS (Railway, Render, Coolify, Fly.io)
- Atur build command: `npm ci && npx prisma generate && npm run build`
- Atur start command: `npx prisma migrate deploy && node .output/server/index.mjs`
- Hubungkan managed PostgreSQL dan isi seluruh environment variable dari `.env.example`.
- Mount persistent volume pada folder `public/uploads` agar foto produk yang diunggah admin tetap tersimpan saat redeploy.
