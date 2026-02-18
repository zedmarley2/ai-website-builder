import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ai_website_builder';

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Pars Tabela data...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@parstabela.com' },
    update: { isAdmin: true },
    create: {
      email: 'admin@parstabela.com',
      name: 'Pars Tabela Admin',
      password: adminPassword,
      isAdmin: true,
    },
  });
  console.log(`Admin user: ${admin.email} (password: admin123)`);

  // 2. Create categories
  const categoriesData = [
    { name: 'Neon Tabelalar', slug: 'neon-tabelalar', description: 'Klasik ve modern neon tabela çözümleri', order: 1 },
    { name: 'LED Tabelalar', slug: 'led-tabelalar', description: 'Enerji tasarruflu LED tabela sistemleri', order: 2 },
    { name: 'Elektronik Tabelalar', slug: 'elektronik-tabelalar', description: 'Dijital ve programlanabilir tabela çözümleri', order: 3 },
    { name: 'Kutu Harf', slug: 'kutu-harf', description: 'Işıklı ve ışıksız kutu harf uygulamaları', order: 4 },
    { name: 'Işıklı Tabelalar', slug: 'isikli-tabelalar', description: 'Çeşitli ışıklı tabela modelleri', order: 5 },
    { name: 'Totem Tabelalar', slug: 'totem-tabelalar', description: 'Totem ve yönlendirme tabela sistemleri', order: 6 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, order: cat.order },
      create: cat,
    });
    categories[cat.slug] = created.id;
    console.log(`Category: ${created.name}`);
  }

  // 3. Create sample products
  const productsData = [
    {
      name: 'Klasik Neon Tabela',
      description: 'El yapımı cam neon tüpler ile üretilen klasik neon tabela. Canlı renkler ve uzun ömürlü kullanım. Restoran, bar ve mağazalar için ideal.',
      price: 4500,
      categorySlug: 'neon-tabelalar',
      featured: true,
      published: true,
    },
    {
      name: 'LED Neon Flex Tabela',
      description: 'Modern LED neon flex teknolojisi ile üretilen tabela. Neon görünümü ile LED verimliliğini birleştirir. Kırılmaz ve enerji tasarruflu.',
      price: 3200,
      categorySlug: 'neon-tabelalar',
      featured: true,
      published: true,
    },
    {
      name: 'RGB LED Tabela',
      description: 'Renk değiştiren RGB LED tabela sistemi. Uzaktan kumanda ile 16 milyon renk seçeneği. İç ve dış mekan kullanımına uygun.',
      price: 5800,
      categorySlug: 'led-tabelalar',
      featured: true,
      published: true,
    },
    {
      name: 'Tek Renk LED Tabela',
      description: 'Yüksek parlaklıkta tek renk LED tabela. Beyaz, kırmızı, mavi, yeşil renk seçenekleri. Düşük enerji tüketimi.',
      price: 2800,
      categorySlug: 'led-tabelalar',
      featured: false,
      published: true,
    },
    {
      name: 'LED Kayan Yazı',
      description: 'Programlanabilir LED kayan yazı panosu. Wi-Fi üzerinden içerik güncellemesi. Çeşitli boyut ve renk seçenekleri.',
      price: 6500,
      categorySlug: 'elektronik-tabelalar',
      featured: true,
      published: true,
    },
    {
      name: 'Dijital Menü Panosu',
      description: 'Restoran ve kafeler için dijital menü panosu. Full HD ekran, uzaktan yönetim. Şık ve modern tasarım.',
      price: 12000,
      categorySlug: 'elektronik-tabelalar',
      featured: false,
      published: true,
    },
    {
      name: 'Paslanmaz Kutu Harf',
      description: 'Paslanmaz çelik kutu harf uygulaması. LED aydınlatmalı, iç ve dış mekan kullanımına uygun. Uzun ömürlü ve bakım gerektirmez.',
      price: 350,
      categorySlug: 'kutu-harf',
      featured: true,
      published: true,
    },
    {
      name: 'Akrilik Kutu Harf',
      description: 'Akrilik yüzeyli kutu harf. Çeşitli renk seçenekleri. LED iç aydınlatma ile gece görünürlüğü. Hafif ve dayanıklı.',
      price: 250,
      categorySlug: 'kutu-harf',
      featured: false,
      published: true,
    },
    {
      name: 'Işıklı Cephe Tabelası',
      description: 'Bina cephesi için ışıklı tabela sistemi. Alüminyum kasa, akrilik yüzey. LED aydınlatma. Su geçirmez IP65.',
      price: 8500,
      categorySlug: 'isikli-tabelalar',
      featured: true,
      published: true,
    },
    {
      name: 'Işıklı Yönlendirme Tabelası',
      description: 'İç mekan yönlendirme tabelası. LED aydınlatmalı, şık tasarım. AVM, hastane ve ofis binaları için ideal.',
      price: 1800,
      categorySlug: 'isikli-tabelalar',
      featured: false,
      published: true,
    },
    {
      name: 'Totem Tabela - Standart',
      description: 'Galvaniz çelik gövde, akrilik yüzey. LED aydınlatmalı. 2-4 metre yükseklik seçenekleri. Dış mekan kullanımına uygun.',
      price: 15000,
      categorySlug: 'totem-tabelalar',
      featured: true,
      published: true,
    },
    {
      name: 'Dijital Totem Tabela',
      description: 'LCD ekranlı dijital totem tabela. Dokunmatik ekran opsiyonu. Wi-Fi bağlantısı ile uzaktan içerik yönetimi.',
      price: 25000,
      categorySlug: 'totem-tabelalar',
      featured: false,
      published: true,
    },
  ];

  for (const prod of productsData) {
    const { categorySlug, ...productData } = prod;
    const categoryId = categories[categorySlug];
    await prisma.product.create({
      data: {
        ...productData,
        price: productData.price,
        categoryId,
      },
    });
    console.log(`Product: ${prod.name}`);
  }

  // 4. Create website record
  const website = await prisma.website.upsert({
    where: { subdomain: 'pars-tabela' },
    update: { name: 'Pars Tabela', published: true },
    create: {
      name: 'Pars Tabela',
      description: 'Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri',
      subdomain: 'pars-tabela',
      published: true,
      userId: admin.id,
    },
  });
  console.log(`Website: ${website.name} (subdomain: ${website.subdomain})`);

  // 5. Create pages for the website
  const pagesData = [
    { name: 'Ana Sayfa', slug: 'ana-sayfa', isHomePage: true, order: 0 },
    { name: 'Hizmetlerimiz', slug: 'hizmetlerimiz', isHomePage: false, order: 1 },
    { name: 'Ürünlerimiz', slug: 'urunlerimiz', isHomePage: false, order: 2 },
    { name: 'Hakkımızda', slug: 'hakkimizda', isHomePage: false, order: 3 },
    { name: 'İletişim', slug: 'iletisim', isHomePage: false, order: 4 },
  ];

  for (const page of pagesData) {
    const existing = await prisma.page.findUnique({
      where: { websiteId_slug: { websiteId: website.id, slug: page.slug } },
    });
    if (!existing) {
      await prisma.page.create({
        data: { ...page, websiteId: website.id },
      });
      console.log(`Page: ${page.name}`);
    } else {
      console.log(`Page already exists: ${page.name}`);
    }
  }

  // 6. Seed default site settings
  const defaultSettings = [
    // General
    { key: 'site_name', value: 'Pars Tabela', group: 'general' },
    { key: 'site_description', value: 'Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri. 15 yılı aşkın deneyim ile ışığınızla fark yaratın.', group: 'general' },
    { key: 'footer_text', value: '© 2024 Pars Tabela. Tüm hakları saklıdır.', group: 'general' },

    // Contact
    { key: 'company_name', value: 'Pars Tabela Reklam ve Tabelacılık', group: 'contact' },
    { key: 'address', value: 'Organize Sanayi Bölgesi, 12. Cadde No:8, Isparta, Türkiye', group: 'contact' },
    { key: 'phone', value: '+90 (246) 555 0123', group: 'contact' },
    { key: 'email', value: 'info@parstabela.com', group: 'contact' },
    { key: 'maps_url', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d99942.0!2d30.28!3d37.76!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c5b0a7f5e9!2sIsparta!5e0!3m2!1str!2str!4v1', group: 'contact' },
    { key: 'working_hours_weekday', value: 'Pazartesi - Cuma: 08:00 - 18:00', group: 'contact' },
    { key: 'working_hours_saturday', value: 'Cumartesi: 09:00 - 14:00', group: 'contact' },
    { key: 'working_hours_sunday', value: 'Pazar: Kapalı', group: 'contact' },

    // Social
    { key: 'instagram', value: 'https://instagram.com/parstabela', group: 'social' },
    { key: 'facebook', value: 'https://facebook.com/parstabela', group: 'social' },
    { key: 'twitter', value: '', group: 'social' },
    { key: 'youtube', value: '', group: 'social' },
    { key: 'linkedin', value: '', group: 'social' },
    { key: 'whatsapp', value: '+902465550123', group: 'social' },

    // SEO
    { key: 'meta_title', value: 'Pars Tabela | Profesyonel Tabela & Reklam Çözümleri', group: 'seo' },
    { key: 'meta_description', value: 'Isparta ve çevresinde profesyonel neon tabela, LED tabela, kutu harf ve elektronik tabela çözümleri. 15 yılı aşkın deneyim.', group: 'seo' },
    { key: 'google_analytics_id', value: '', group: 'seo' },
    { key: 'google_search_console', value: '', group: 'seo' },

    // Appearance
    { key: 'primary_color', value: '#1a365d', group: 'appearance' },
    { key: 'secondary_color', value: '#d4a843', group: 'appearance' },
    { key: 'font', value: 'Inter', group: 'appearance' },
    { key: 'header_style', value: 'glass', group: 'appearance' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, group: setting.group },
      create: setting,
    });
  }
  console.log(`Site settings: ${defaultSettings.length} defaults created`);

  // 7. Seed sample inquiries
  // Grab some product IDs for linking
  const sampleProducts = await prisma.product.findMany({ take: 3, select: { id: true, name: true } });

  const inquiriesData = [
    {
      name: 'Mehmet Yılmaz',
      email: 'mehmet@example.com',
      phone: '+90 532 111 2233',
      message: 'Mağazamız için LED tabela yaptırmak istiyoruz. Yaklaşık 3x1 metre boyutlarında olacak. Fiyat teklifi alabilir miyiz?',
      productId: sampleProducts[0]?.id ?? null,
      status: 'NEW' as const,
    },
    {
      name: 'Ayşe Demir',
      email: 'ayse.demir@example.com',
      phone: '+90 505 444 5566',
      message: 'Yeni açılacak restoranımız için neon tabela ve dijital menü panosu fiyat bilgisi almak istiyorum.',
      productId: null,
      status: 'IN_REVIEW' as const,
    },
    {
      name: 'Ali Kaya',
      email: 'ali.kaya@example.com',
      phone: '+90 542 777 8899',
      message: 'Fabrikamız için totem tabela yaptırmak istiyoruz. Toplamda 3 adet, 4 metre yüksekliğinde. Kurulum dahil fiyat verebilir misiniz?',
      productId: sampleProducts[2]?.id ?? null,
      status: 'REPLIED' as const,
    },
    {
      name: 'Fatma Özkan',
      email: 'fatma@example.com',
      phone: null,
      message: 'Kutu harf uygulaması için bilgi almak istiyorum. Paslanmaz çelik tercih ediyorum.',
      productId: sampleProducts[1]?.id ?? null,
      status: 'NEW' as const,
    },
    {
      name: 'Mehmet Yılmaz',
      email: 'mehmet@example.com',
      phone: '+90 532 111 2233',
      message: 'Önceki talebime ek olarak, iç mekan yönlendirme tabelaları da istiyoruz. Toplam 10 adet.',
      productId: null,
      status: 'NEW' as const,
    },
  ];

  for (const inq of inquiriesData) {
    await prisma.inquiry.create({ data: inq });
    console.log(`Inquiry: ${inq.name} - ${inq.status}`);
  }

  // 8. Seed sample notifications
  const notificationsData = [
    {
      title: 'Yeni İletişim Talebi',
      message: 'Mehmet Yılmaz yeni bir mesaj gönderdi: Mağazamız için LED tabela yaptırmak istiyoruz...',
      type: 'inquiry',
      read: false,
      link: '/admin/siparisler',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      title: 'Yeni Teklif Talebi',
      message: 'Fatma Özkan bir ürün için teklif istedi: Kutu harf uygulaması için bilgi almak istiyorum...',
      type: 'inquiry',
      read: false,
      link: '/admin/siparisler',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      title: 'Ürün Güncellendi',
      message: 'Klasik Neon Tabela ürünü başarıyla güncellendi.',
      type: 'product',
      read: false,
      link: '/admin/urunler',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      title: 'Yeni İletişim Talebi',
      message: 'Ali Kaya yeni bir mesaj gönderdi: Fabrikamız için totem tabela yaptırmak istiyoruz...',
      type: 'inquiry',
      read: true,
      link: '/admin/siparisler',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      title: 'Sistem Güncellemesi',
      message: 'Yönetim paneli başarıyla güncellendi. Yeni özellikler kullanıma hazır.',
      type: 'system',
      read: true,
      link: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  for (const notif of notificationsData) {
    await prisma.notification.create({ data: notif });
  }
  console.log(`Notifications: ${notificationsData.length} samples created`);

  console.log('\nSeed completed successfully!');
  console.log('Admin login: admin@parstabela.com / admin123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
