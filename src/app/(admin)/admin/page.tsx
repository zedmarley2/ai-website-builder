import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

function PackageIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-[#334155] dark:bg-[#1e293b]">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1a365d] dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [totalProducts, totalCategories, publishedProducts, featuredProducts, recentProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.product.count({ where: { published: true } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yönetim Paneli / <span className="text-[#1a365d] dark:text-[#d4a843]">Dashboard</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Hoş Geldiniz</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pars Tabela yönetim paneline hoş geldiniz
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<PackageIcon />}
          value={totalProducts}
          label="Toplam Ürün"
          color="bg-[#1a365d]/10 text-[#1a365d] dark:bg-[#1a365d]/30 dark:text-[#d4a843]"
        />
        <StatCard
          icon={<TagIcon />}
          value={totalCategories}
          label="Kategoriler"
          color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        />
        <StatCard
          icon={<CheckIcon />}
          value={publishedProducts}
          label="Yayında"
          color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
        />
        <StatCard
          icon={<StarIcon />}
          value={featuredProducts}
          label="Öne Çıkan"
          color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-[#d4a843]"
        />
      </div>

      {/* Recent products */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4 dark:border-[#334155]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Son Eklenen Ürünler</h2>
          <Link
            href="/admin/products"
            className="text-sm font-medium text-[#1a365d] transition-colors hover:text-[#1a365d]/70 dark:text-[#d4a843] dark:hover:text-[#d4a843]/80"
          >
            Tümünü Gör
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Henüz ürün eklenmemiş</p>
            <Link
              href="/admin/products/new"
              className="mt-3 inline-block text-sm font-medium text-[#1a365d] hover:underline dark:text-[#d4a843]"
            >
              İlk ürünü ekle
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-left dark:border-[#334155]">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Görsel</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ürün Adı</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Kategori</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fiyat</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      {product.images[0] ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt ?? product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] bg-gray-50 dark:border-[#334155] dark:bg-[#0f172a]">
                          <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-sm font-medium text-gray-900 hover:text-[#1a365d] dark:text-white dark:hover:text-[#d4a843]"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {product.price ? `${Number(product.price).toLocaleString('tr-TR')} ₺` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.published ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
                          Yayında
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-400">
                          Taslak
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
