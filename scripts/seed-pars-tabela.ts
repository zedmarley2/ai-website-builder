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
