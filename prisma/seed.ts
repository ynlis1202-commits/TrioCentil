import { PrismaClient, UserRole, OrderType, OrderStatus, PaymentMethod, PaymentStatus, DiscountType, VariantType, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Memulai seeding database Warung Makan TrioCentil...')

  // 1. Users (Admin, Staff, Demo Customer)
  const adminPassword = await bcrypt.hash('AdminTrioCentil123!', 12)
  const staffPassword = await bcrypt.hash('KasirTrioCentil123!', 12)
  const customerPassword = await bcrypt.hash('Pelanggan123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@triocentil.id' },
    update: {},
    create: {
      name: 'Pemilik TrioCentil',
      email: 'admin@triocentil.id',
      phone: '6281234567890',
      passwordHash: adminPassword,
      role: UserRole.ADMIN
    }
  })

  await prisma.user.upsert({
    where: { email: 'kasir@triocentil.id' },
    update: {},
    create: {
      name: 'Kasir TrioCentil',
      email: 'kasir@triocentil.id',
      phone: '6281234567891',
      passwordHash: staffPassword,
      role: UserRole.STAFF
    }
  })

  const demoUser = await prisma.user.upsert({
    where: { email: 'budi@contoh.id' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'budi@contoh.id',
      phone: '6281298765432',
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER
    }
  })

  // 2. Categories
  const categoryData = [
    {
      name: 'Sate Ayam',
      slug: 'sate-ayam',
      description: 'Sate ayam bakar arang pilihan dengan bumbu kacang legit dan kecap manis khas TrioCentil.',
      icon: 'flame',
      imageUrl: '/images/sate-original.jpg',
      sortOrder: 1
    },
    {
      name: 'Nasi dan Lontong',
      slug: 'nasi-dan-lontong',
      description: 'Nasi putih pulen hangat dan lontong daun pisang lembut pendamping sempurna sate ayam.',
      icon: 'utensils',
      imageUrl: '/images/sate-nasi.jpg',
      sortOrder: 2
    },
    {
      name: 'Makanan Pendamping',
      slug: 'makanan-pendamping',
      description: 'Kerupuk renyah, sate kulit gurih, acar segar, dan tambahan sambal spesial.',
      icon: 'soup',
      imageUrl: '/images/pendamping.jpg',
      sortOrder: 3
    },
    {
      name: 'Minuman Es',
      slug: 'minuman-es',
      description: 'Aneka minuman dingin dan es segar pelepas dahaga setelah menikmati sate ayam hangat.',
      icon: 'cup-soda',
      imageUrl: '/images/es-teh.jpg',
      sortOrder: 4
    }
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder
      },
      create: cat
    })
    categories[cat.slug] = saved.id
  }

  // 3. Products + Images + Variants
  const defaultSpicy = ['Tidak Pedas', 'Sedang', 'Pedas', 'Extra Pedas']
  const defaultExtraSambal = [
    { name: 'Tanpa Tambahan', price: 0 },
    { name: 'Sambal Kacang Extra', price: 3000 },
    { name: 'Sambal Kecap Rawit', price: 2500 },
    { name: 'Sambal Bawang Pedas', price: 3000 }
  ]

  const productsData = [
    {
      categorySlug: 'sate-ayam',
      name: 'Sate Ayam Original',
      slug: 'sate-ayam-original',
      shortDescription: '10 tusuk sate ayam daging empuk dengan bumbu kacang legit, kecap manis, bawang merah & jeruk limau.',
      description: 'Menu andalan Warung Makan TrioCentil! 10 tusuk potongan daging dada dan paha ayam pilihan yang dimarinasi bumbu rempah rahasia, dibakar di atas bara arang hingga harum menggoda, lalu disiram bumbu kacang halus kental, kecap manis premium, taburan bawang goreng renyah, irisan bawang merah segar, dan perasan jeruk limau.',
      price: 18000,
      comparePrice: 20000,
      sku: 'TC-SAT-001',
      stock: 120,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.9,
      reviewCount: 248,
      preparationTime: 12,
      image: '/images/sate-original.jpg',
      spicyOptions: defaultSpicy,
      extraSambalOptions: defaultExtraSambal,
      variants: [
        { name: 'Porsi Reguler (10 Tusuk)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Porsi Jumbo (15 Tusuk)', type: VariantType.PORTION, priceDelta: 10000, sortOrder: 2 },
        { name: 'Full Daging (Tanpa Kulit)', type: VariantType.ADDON, priceDelta: 3000, sortOrder: 3 }
      ]
    },
    {
      categorySlug: 'sate-ayam',
      name: 'Sate Ayam + Nasi',
      slug: 'sate-ayam-nasi',
      shortDescription: 'Paket kenyang 10 tusuk sate ayam bumbu kacang khas lengkap dengan nasi putih pulen hangat.',
      description: 'Kombinasi favorit makan siang dan makan malam! 10 tusuk sate ayam bakar arang berlumur bumbu kacang gurih manis disajikan bersama seporsi nasi putih pulen hangat bertabur bawang goreng, acar timun wortel segar, dan sambal sesuai tingkat kepedasan pilihanmu.',
      price: 22000,
      comparePrice: 25000,
      sku: 'TC-SAT-002',
      stock: 100,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.9,
      reviewCount: 312,
      preparationTime: 12,
      image: '/images/sate-nasi.jpg',
      spicyOptions: defaultSpicy,
      extraSambalOptions: defaultExtraSambal,
      variants: [
        { name: 'Porsi Reguler (10 Tusuk + Nasi)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Porsi Jumbo (15 Tusuk + Nasi)', type: VariantType.PORTION, priceDelta: 10000, sortOrder: 2 },
        { name: 'Tambah Kerupuk Udang', type: VariantType.ADDON, priceDelta: 3000, sortOrder: 3 }
      ]
    },
    {
      categorySlug: 'sate-ayam',
      name: 'Sate Ayam + Lontong',
      slug: 'sate-ayam-lontong',
      shortDescription: '10 tusuk sate ayam bakar lembut dipadukan potongan lontong daun pisang yang wangi dan empuk.',
      description: 'Cita rasa klasik warung sate sejati! Lontong bungkus daun pisang yang lembut dan harum dipotong rapi, disiram bumbu kacang khas TrioCentil yang creamy, ditemani 10 tusuk sate ayam bakar arang hangat, irisan bawang merah, dan jeruk limau segar.',
      price: 20000,
      comparePrice: 23000,
      sku: 'TC-SAT-003',
      stock: 95,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.9,
      reviewCount: 276,
      preparationTime: 12,
      image: '/images/sate-lontong.jpg',
      spicyOptions: defaultSpicy,
      extraSambalOptions: defaultExtraSambal,
      variants: [
        { name: 'Porsi Reguler (10 Tusuk + Lontong)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Porsi Jumbo (15 Tusuk + Lontong)', type: VariantType.PORTION, priceDelta: 10000, sortOrder: 2 },
        { name: 'Tambah Lontong Ekstra', type: VariantType.ADDON, priceDelta: 5000, sortOrder: 3 }
      ]
    },
    {
      categorySlug: 'sate-ayam',
      name: 'Sate Ayam Taichan Pedas',
      slug: 'sate-ayam-taichan-pedas',
      shortDescription: '10 tusuk sate dada ayam bakar gurih jeruk nipis dengan sambal rawit merah segar yang nendang.',
      description: 'Untuk pecinta pedas segar! 10 tusuk daging dada ayam empuk dibakar dengan bumbu bawang putih, kaldu gurih, dan perasan jeruk nipis tanpa kecap, disajikan bersama sambal cabai rawit merah ulek dadakan dan kaldu tabur spesial.',
      price: 22000,
      comparePrice: null,
      sku: 'TC-SAT-004',
      stock: 70,
      isFeatured: true,
      isBestSeller: false,
      rating: 4.8,
      reviewCount: 134,
      preparationTime: 12,
      image: '/images/sate-original.jpg',
      spicyOptions: ['Sedang', 'Pedas', 'Extra Pedas'],
      extraSambalOptions: defaultExtraSambal,
      variants: [
        { name: 'Porsi Reguler (10 Tusuk)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Tambah Lontong', type: VariantType.ADDON, priceDelta: 5000, sortOrder: 2 },
        { name: 'Tambah Nasi', type: VariantType.ADDON, priceDelta: 5000, sortOrder: 3 }
      ]
    },
    {
      categorySlug: 'nasi-dan-lontong',
      name: 'Nasi Putih Hangat',
      slug: 'nasi-putih-hangat',
      shortDescription: 'Seporsi nasi putih pulen hangat dari beras pilihan dengan taburan bawang goreng renyah.',
      description: 'Nasi putih pulen yang dimasak segar setiap jam agar selalu hangat dan harum, cocok disantap bersama aneka sate ayam dan sambal kacang.',
      price: 5000,
      comparePrice: null,
      sku: 'TC-NAS-001',
      stock: 150,
      isFeatured: false,
      isBestSeller: false,
      rating: 4.8,
      reviewCount: 95,
      preparationTime: 5,
      image: '/images/sate-nasi.jpg',
      spicyOptions: [],
      extraSambalOptions: [],
      variants: [
        { name: 'Porsi Biasa', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Porsi Jumbo (1.5x)', type: VariantType.PORTION, priceDelta: 3000, sortOrder: 2 }
      ]
    },
    {
      categorySlug: 'nasi-dan-lontong',
      name: 'Lontong Daun Pisang',
      slug: 'lontong-daun-pisang',
      shortDescription: 'Lontong lembut aromatik dibungkus daun pisang alami, dipotong rapi siap disiram bumbu kacang.',
      description: 'Lontong tradisional buatan dapur TrioCentil yang dimasak perlahan menggunakan bungkus daun pisang sehingga menghasilkan tekstur padat-lembut dan aroma wangi khas.',
      price: 5000,
      comparePrice: null,
      sku: 'TC-NAS-002',
      stock: 120,
      isFeatured: false,
      isBestSeller: false,
      rating: 4.9,
      reviewCount: 118,
      preparationTime: 5,
      image: '/images/sate-lontong.jpg',
      spicyOptions: [],
      extraSambalOptions: [],
      variants: [
        { name: '1 Porsi Lontong', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Siram Bumbu Kacang', type: VariantType.ADDON, priceDelta: 3000, sortOrder: 2 }
      ]
    },
    {
      categorySlug: 'makanan-pendamping',
      name: 'Sate Kulit Ayam Bakar',
      slug: 'sate-kulit-ayam-bakar',
      shortDescription: '5 tusuk sate kulit ayam renyah karamel berlumur kecap manis dan bumbu kacang gurih.',
      description: 'Kulit ayam pilihan yang dibersihkan sempurna, dibumbui ketumbar bawang putih, lalu dibakar hingga bagian luarnya agak garing karamel sementara bagian dalamnya tetap gurih juicy.',
      price: 12000,
      comparePrice: null,
      sku: 'TC-PND-001',
      stock: 60,
      isFeatured: true,
      isBestSeller: false,
      rating: 4.9,
      reviewCount: 162,
      preparationTime: 10,
      image: '/images/pendamping.jpg',
      spicyOptions: defaultSpicy,
      extraSambalOptions: defaultExtraSambal,
      variants: [
        { name: 'Isi 5 Tusuk', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Isi 10 Tusuk', type: VariantType.PORTION, priceDelta: 12000, sortOrder: 2 }
      ]
    },
    {
      categorySlug: 'makanan-pendamping',
      name: 'Kerupuk Udang & Acar Segar',
      slug: 'kerupuk-udang-acar-segar',
      shortDescription: 'Paket kerupuk udang renyah ditemani acar timun, wortel, dan bawang merah segar.',
      description: 'Pelengkap wajib makan sate! Kerupuk udang goreng renyah dipadukan dengan acar timun wortel asam-manis segar untuk menyeimbangkan kelezatan bumbu kacang.',
      price: 5000,
      comparePrice: null,
      sku: 'TC-PND-002',
      stock: 100,
      isFeatured: false,
      isBestSeller: false,
      rating: 4.7,
      reviewCount: 74,
      preparationTime: 3,
      image: '/images/pendamping.jpg',
      spicyOptions: [],
      extraSambalOptions: [],
      variants: []
    },
    {
      categorySlug: 'makanan-pendamping',
      name: 'Bumbu Kacang Extra Cup',
      slug: 'bumbu-kacang-extra-cup',
      shortDescription: '1 cup bumbu kacang kental khas TrioCentil + irisan bawang merah dan jeruk limau.',
      description: 'Suka bumbu kacang melimpah? Tambahkan porsi ekstra bumbu kacang ulek khas TrioCentil dalam kemasan cup higienis.',
      price: 4000,
      comparePrice: null,
      sku: 'TC-PND-003',
      stock: 100,
      isFeatured: false,
      isBestSeller: false,
      rating: 4.8,
      reviewCount: 89,
      preparationTime: 3,
      image: '/images/pendamping.jpg',
      spicyOptions: defaultSpicy,
      extraSambalOptions: [],
      variants: []
    },
    {
      categorySlug: 'minuman-es',
      name: 'Es Teh Manis',
      slug: 'es-teh-manis',
      shortDescription: 'Teh melati seduh segar dengan gula tebu murni dan es batu kristal yang menyegarkan.',
      description: 'Es Teh Manis klasik yang diseduh dari daun teh melati wangi pilihan dengan tingkat kemanisan pas dan es batu kristal dingin menyegarkan.',
      price: 5000,
      comparePrice: null,
      sku: 'TC-MIN-001',
      stock: 200,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.9,
      reviewCount: 340,
      preparationTime: 3,
      image: '/images/es-teh.jpg',
      spicyOptions: [],
      extraSambalOptions: [],
      variants: [
        { name: 'Manis Normal', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Sedikit Gula (Less Sugar)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 2 },
        { name: 'Tawar (Tanpa Gula)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 3 },
        { name: 'Ukuran Jumbo', type: VariantType.ADDON, priceDelta: 3000, sortOrder: 4 }
      ]
    },
    {
      categorySlug: 'minuman-es',
      name: 'Es Jeruk',
      slug: 'es-jeruk',
      shortDescription: 'Perasan jeruk manis segar asli 100% dengan es batu melimpah, kaya vitamin C dan super segar.',
      description: 'Dibuat langsung dari perasan jeruk peras manis berkualitas setiap kali dipesan, tanpa pemanis buatan. Segar alami dan sangat cocok menemani santapan sate ayam bakar!',
      price: 7000,
      comparePrice: 8000,
      sku: 'TC-MIN-002',
      stock: 150,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.9,
      reviewCount: 285,
      preparationTime: 4,
      image: '/images/es-jeruk.jpg',
      spicyOptions: [],
      extraSambalOptions: [],
      variants: [
        { name: 'Dingin (Es Jeruk)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Hangat (Jeruk Hangat)', type: VariantType.PORTION, priceDelta: 0, sortOrder: 2 },
        { name: 'Ukuran Jumbo', type: VariantType.ADDON, priceDelta: 4000, sortOrder: 3 }
      ]
    },
    {
      categorySlug: 'minuman-es',
      name: 'Es Lemon Tea Segar',
      slug: 'es-lemon-tea-segar',
      shortDescription: 'Perpaduan teh harum dan perasan lemon segar dingin untuk kesegaran maksimal.',
      description: 'Minuman dingin favorit anak muda! Seduhan teh pilihan dicampur perasan jeruk lemon segar dan potongan lemon tipis yang memberi sensasi asam-manis menyegarkan.',
      price: 8000,
      comparePrice: null,
      sku: 'TC-MIN-003',
      stock: 120,
      isFeatured: false,
      isBestSeller: false,
      rating: 4.8,
      reviewCount: 110,
      preparationTime: 4,
      image: '/images/es-teh.jpg',
      spicyOptions: [],
      extraSambalOptions: [],
      variants: [
        { name: 'Ukuran Reguler', type: VariantType.PORTION, priceDelta: 0, sortOrder: 1 },
        { name: 'Ukuran Jumbo', type: VariantType.ADDON, priceDelta: 4000, sortOrder: 2 }
      ]
    }
  ]

  const productMap: Record<string, { id: string; name: string; price: number }> = {}

  for (const item of productsData) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } })
    let productId: string

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          categoryId: categories[item.categorySlug]!,
          name: item.name,
          slug: item.slug,
          shortDescription: item.shortDescription,
          description: item.description,
          price: item.price,
          comparePrice: item.comparePrice,
          sku: item.sku,
          stock: item.stock,
          isAvailable: true,
          isFeatured: item.isFeatured,
          isBestSeller: item.isBestSeller,
          rating: item.rating,
          reviewCount: item.reviewCount,
          preparationTime: item.preparationTime,
          spicyOptions: item.spicyOptions,
          extraSambalOptions: item.extraSambalOptions,
          images: {
            create: [
              {
                url: item.image,
                alt: item.name,
                isPrimary: true,
                sortOrder: 0
              }
            ]
          },
          variants: {
            create: item.variants
          }
        }
      })
      productId = created.id
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          price: item.price,
          comparePrice: item.comparePrice
        }
      })
      productId = existing.id
    }

    productMap[item.slug] = { id: productId, name: item.name, price: item.price }
  }

  // 4. Promotions
  const now = new Date()
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const promos = [
    {
      code: 'HEMAT10',
      title: 'Diskon 10% Pecinta Sate',
      description: 'Potongan 10% maksimal Rp 15.000 untuk minimal belanja Rp 40.000 di Warung Makan TrioCentil.',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 40000,
      maxDiscount: 15000,
      usageLimit: 500,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: nextYear,
      isActive: true,
      badgeText: 'DISKON 10%'
    },
    {
      code: 'SATECENTIL',
      title: 'Potongan Langsung Rp 5.000',
      description: 'Nikmati potongan harga Rp 5.000 untuk minimal pemesanan Rp 35.000 semua menu favorit.',
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      minOrderAmount: 35000,
      maxDiscount: 5000,
      usageLimit: 300,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: nextYear,
      isActive: true,
      badgeText: 'HEMAT Rp 5RB'
    },
    {
      code: 'MABARSATE',
      title: 'Promo Rombongan Hemat Rp 15.000',
      description: 'Pesan rame-rame minimal Rp 100.000 langsung dapat potongan Rp 15.000!',
      discountType: DiscountType.FIXED,
      discountValue: 15000,
      minOrderAmount: 100000,
      maxDiscount: 15000,
      usageLimit: 200,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: nextYear,
      isActive: true,
      badgeText: 'PAKET RAME'
    }
  ]

  for (const promo of promos) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: {},
      create: promo
    })
  }

  // 5. Store Settings
  const defaultSettings = [
    { key: 'store_name', value: 'Warung Makan TrioCentil', group: 'general', description: 'Nama resmi warung makan' },
    { key: 'store_tagline', value: 'Rasa Nikmat, Harga Bersahabat, Bikin Nagih!', group: 'general', description: 'Tagline utama warung' },
    { key: 'store_address', value: 'Jalan Trans Kalimantan, Bawas, PT Palm Agrosia Lestari Makmur', group: 'general', description: 'Alamat lengkap lokasi warung' },
    { key: 'store_phone', value: '0882-0208-98753 / 0823-5442-2734 / 0823-1342-1226', group: 'contact', description: 'Nomor telepon/HP yang bisa dihubungi' },
    { key: 'store_whatsapp', value: process.env.STORE_WHATSAPP_NUMBER || '62882020898753', group: 'contact', description: 'Nomor WhatsApp pemesanan resmi' },
    { key: 'store_hours_weekday', value: 'Senin - Jumat: 07.00 - 22.00 WIB', group: 'hours', description: 'Jam operasional hari kerja' },
    { key: 'store_hours_weekend', value: 'Sabtu - Minggu: 08.00 - 21.00 WIB', group: 'hours', description: 'Jam operasional akhir pekan' },
    { key: 'store_is_open', value: 'true', group: 'general', description: 'Status buka/tutup pemesanan online' },
    { key: 'delivery_fee', value: '10000', group: 'delivery', description: 'Ongkos kirim standar pesan antar (IDR)' },
    { key: 'free_delivery_min', value: '75000', group: 'delivery', description: 'Minimal belanja gratis ongkir (IDR)' },
    { key: 'bank_name', value: 'Bank BCA', group: 'payment', description: 'Nama bank untuk transfer' },
    { key: 'bank_account_number', value: '5210-8899-2727', group: 'payment', description: 'Nomor rekening transfer' },
    { key: 'bank_account_holder', value: 'Warung Makan TrioCentil', group: 'payment', description: 'Nama pemilik rekening' },
    { key: 'qris_enabled', value: 'true', group: 'payment', description: 'Aktifkan pembayaran QRIS' },
    { key: 'qris_merchant_name', value: 'WARUNG MAKAN TRIOCENTIL', group: 'payment', description: 'Nama merchant pada QRIS' },
    { key: 'store_maps_url', value: 'https://maps.google.com/?q=Jalan+Trans+Kalimantan+Bawas+PT+Palm+Agrosia+Lestari+Makmur', group: 'contact', description: 'Tautan Google Maps lokasi warung' }
  ]

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    })
  }

  // 6. Seed Demo Customer & Sample Orders (only if no orders exist yet)
  const existingOrders = await prisma.order.count()
  if (existingOrders === 0) {
    const custBudi = await prisma.customer.upsert({
      where: { whatsapp: '6281298765432' },
      update: {},
      create: {
        userId: demoUser.id,
        name: 'Budi Santoso',
        whatsapp: '6281298765432',
        email: 'budi@contoh.id',
        defaultAddress: 'Jl. Bangka Raya No. 14, Mampang Prapatan, Jakarta Selatan',
        totalOrders: 2,
        totalSpent: 109000
      }
    })

    const custSiti = await prisma.customer.upsert({
      where: { whatsapp: '6285677889900' },
      update: {},
      create: {
        name: 'Siti Rahmawati',
        whatsapp: '6285677889900',
        defaultAddress: 'Jl. Kemang Timur No. 88, Jakarta Selatan',
        totalOrders: 1,
        totalSpent: 69000
      }
    })

    const sateNasi = productMap['sate-ayam-nasi']!
    const sateLontong = productMap['sate-ayam-lontong']!
    const esTeh = productMap['es-teh-manis']!
    const esJeruk = productMap['es-jeruk']!

    // Order 1: Completed yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.order.create({
      data: {
        orderNumber: 'TC-20261123-0001',
        customerId: custBudi.id,
        userId: demoUser.id,
        customerName: custBudi.name,
        customerWhatsapp: custBudi.whatsapp,
        orderType: OrderType.DELIVERY,
        deliveryAddress: custBudi.defaultAddress,
        notes: 'Bumbu kacangnya dipisah ya mas',
        subtotal: 69000,
        deliveryFee: 10000,
        discountAmount: 0,
        totalAmount: 79000,
        status: OrderStatus.COMPLETED,
        createdAt: yesterday,
        items: {
          create: [
            {
              productId: sateNasi.id,
              productName: sateNasi.name,
              unitPrice: sateNasi.price,
              quantity: 2,
              spicyLevel: 'Pedas',
              extraSambal: 'Sambal Kacang Extra',
              lineTotal: 54000
            },
            {
              productId: esJeruk.id,
              productName: esJeruk.name,
              unitPrice: esJeruk.price,
              quantity: 1,
              lineTotal: 9000
            },
            {
              productId: esTeh.id,
              productName: esTeh.name,
              unitPrice: esTeh.price,
              quantity: 1,
              lineTotal: 6000
            }
          ]
        },
        statusHistories: {
          create: [
            { toStatus: OrderStatus.PENDING_CONFIRMATION, note: 'Pesanan masuk dari website', createdAt: yesterday },
            { fromStatus: OrderStatus.PENDING_CONFIRMATION, toStatus: OrderStatus.CONFIRMED, note: 'Pesanan dikonfirmasi admin', changedById: admin.id, createdAt: yesterday },
            { fromStatus: OrderStatus.CONFIRMED, toStatus: OrderStatus.COMPLETED, note: 'Pesanan telah diterima pelanggan', changedById: admin.id, createdAt: yesterday }
          ]
        },
        payment: {
          create: {
            method: PaymentMethod.QRIS,
            status: PaymentStatus.PAID,
            amount: 79000,
            paidAt: yesterday
          }
        }
      }
    })

    // Order 2: Cooking today
    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'TC-20261124-0001',
        customerId: custSiti.id,
        customerName: custSiti.name,
        customerWhatsapp: custSiti.whatsapp,
        orderType: OrderType.TAKEAWAY,
        notes: 'Diambil jam 12 siang ya',
        subtotal: 69000,
        deliveryFee: 0,
        discountAmount: 0,
        totalAmount: 69000,
        status: OrderStatus.COOKING,
        items: {
          create: [
            {
              productId: sateLontong.id,
              productName: sateLontong.name,
              unitPrice: sateLontong.price,
              quantity: 2,
              spicyLevel: 'Sedang',
              lineTotal: 54000
            },
            {
              productId: esJeruk.id,
              productName: esJeruk.name,
              unitPrice: esJeruk.price,
              quantity: 1,
              lineTotal: 9000
            },
            {
              productId: esTeh.id,
              productName: esTeh.name,
              unitPrice: esTeh.price,
              quantity: 1,
              lineTotal: 6000
            }
          ]
        },
        statusHistories: {
          create: [
            { toStatus: OrderStatus.PENDING_CONFIRMATION, note: 'Pesanan masuk dari website' },
            { fromStatus: OrderStatus.PENDING_CONFIRMATION, toStatus: OrderStatus.CONFIRMED, note: 'Dikonfirmasi kasir', changedById: admin.id },
            { fromStatus: OrderStatus.CONFIRMED, toStatus: OrderStatus.COOKING, note: 'Sate sedang dibakar di dapur', changedById: admin.id }
          ]
        },
        payment: {
          create: {
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PAID,
            amount: 69000,
            paidAt: new Date()
          }
        }
      }
    })

    // Order 3: Pending confirmation today
    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'TC-20261124-0002',
        customerId: custBudi.id,
        userId: demoUser.id,
        customerName: custBudi.name,
        customerWhatsapp: custBudi.whatsapp,
        orderType: OrderType.DINE_IN,
        tableNumber: 'Meja 04',
        notes: 'Minta bawang merah yang banyak ya',
        subtotal: 33000,
        deliveryFee: 0,
        discountAmount: 0,
        totalAmount: 33000,
        status: OrderStatus.PENDING_CONFIRMATION,
        items: {
          create: [
            {
              productId: sateNasi.id,
              productName: sateNasi.name,
              unitPrice: sateNasi.price,
              quantity: 1,
              spicyLevel: 'Extra Pedas',
              lineTotal: 27000
            },
            {
              productId: esTeh.id,
              productName: esTeh.name,
              unitPrice: esTeh.price,
              quantity: 1,
              lineTotal: 6000
            }
          ]
        },
        statusHistories: {
          create: [
            { toStatus: OrderStatus.PENDING_CONFIRMATION, note: 'Menunggu konfirmasi dari kasir' }
          ]
        },
        payment: {
          create: {
            method: PaymentMethod.CASH,
            status: PaymentStatus.PENDING,
            amount: 33000
          }
        }
      }
    })

    await prisma.notification.createMany({
      data: [
        {
          type: NotificationType.NEW_ORDER,
          title: `Pesanan Baru #${order3.orderNumber}`,
          message: `${order3.customerName} memesan Makan di Tempat (Meja 04) senilai Rp 33.000.`,
          orderId: order3.id,
          isRead: false
        },
        {
          type: NotificationType.ORDER_STATUS,
          title: `Pesanan #${order2.orderNumber} Sedang Dimasak`,
          message: `Pesanan Ambil Sendiri atas nama ${order2.customerName} sedang diproses dapur.`,
          orderId: order2.id,
          isRead: true
        }
      ]
    })
  }

  console.log('Seeding Warung Makan TrioCentil selesai!')
  console.log('Akun Admin: admin@triocentil.id / AdminTrioCentil123!')
  console.log('Akun Kasir: kasir@triocentil.id / KasirTrioCentil123!')
  console.log('Akun Pelanggan: budi@contoh.id / Pelanggan123!')
}

main()
  .catch((err) => {
    console.error('Error saat seeding:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
