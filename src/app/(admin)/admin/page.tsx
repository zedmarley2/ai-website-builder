import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition-all hover:border-[#00f0ff]/30"
      style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.03)' }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00f0ff]/10 text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Pars Tabela yonetim paneline hos geldiniz</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={'\u{1F4E6}'} value={totalProducts} label="Toplam Urun" />
        <StatCard icon={'\u{1F3F7}\uFE0F'} value={totalCategories} label="Kategori" />
        <StatCard icon={'\u2705'} value={publishedProducts} label="Yayinda" />
        <StatCard icon={'\u2B50'} value={featuredProducts} label="One Cikan" />
      </div>

      {/* Recent products */}
      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Son Eklenen Urunler</h2>
          <Link
            href="/admin/products"
            className="text-sm text-[#00f0ff] transition-colors hover:text-[#00f0ff]/80"
          >
            Tumunu Gor
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-500">Henuz urun eklenmemis.</p>
            <Link
              href="/admin/products/new"
              className="mt-3 inline-block text-sm text-[#00f0ff] hover:text-[#00f0ff]/80"
            >
              Ilk urunu ekle
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Gorsel</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Urun Adi</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Kategori</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Fiyat</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-800/50">
                    <td className="px-5 py-3">
                      {product.images[0] ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-700">
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt ?? product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800">
                          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-sm font-medium text-white hover:text-[#00f0ff] transition-colors"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-400">{product.category.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-300">
                        {product.price ? `${Number(product.price).toLocaleString('tr-TR')} TL` : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {product.published ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          Yayinda
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-400">
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
