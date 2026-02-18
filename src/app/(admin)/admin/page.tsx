import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Tags, Eye, FileEdit, Plus, ExternalLink, Mail } from 'lucide-react';
import { DashboardCharts } from '@/components/admin/dashboard-charts';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, value, label, color, bgColor }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-[#334155] dark:bg-[#1e293b]">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor}`}>
          <div className={color}>{icon}</div>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1a365d] dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  if (published) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
        Yayinda
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-400">
      Taslak
    </span>
  );
}

function InquiryStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    IN_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    REPLIED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    CLOSED: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  };
  const labels: Record<string, string> = {
    NEW: 'Yeni',
    IN_REVIEW: 'Inceleniyor',
    REPLIED: 'Yanitlandi',
    CLOSED: 'Kapandi',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.NEW}`}>
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    totalCategories,
    publishedProducts,
    draftProducts,
    totalInquiries,
    newInquiries,
    recentProducts,
    recentInquiries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.product.count({ where: { published: false } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: 'NEW' } }),
    prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
    }),
    prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
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
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Hos Geldiniz</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pars Tabela yönetim paneline hos geldiniz
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-6 w-6" />}
          value={totalProducts}
          label="Toplam Ürün"
          color="text-[#1a365d] dark:text-[#d4a843]"
          bgColor="bg-[#1a365d]/10 dark:bg-[#1a365d]/30"
        />
        <StatCard
          icon={<Tags className="h-6 w-6" />}
          value={totalCategories}
          label="Kategoriler"
          color="text-violet-600 dark:text-violet-400"
          bgColor="bg-violet-100 dark:bg-violet-500/20"
        />
        <StatCard
          icon={<Eye className="h-6 w-6" />}
          value={publishedProducts}
          label="Yayinda"
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-500/20"
        />
        <StatCard
          icon={<FileEdit className="h-6 w-6" />}
          value={draftProducts}
          label="Taslak"
          color="text-amber-600 dark:text-[#d4a843]"
          bgColor="bg-amber-100 dark:bg-amber-500/20"
        />
      </div>

      {/* Revenue Chart + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b] lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aylik Gelir</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Son 12 aylik gelir grafiği
              </p>
            </div>
          </div>
          <DashboardCharts />
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
            Hizli Islemler
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/urunler/yeni"
              className="flex w-full items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-[#1a365d] hover:bg-[#1a365d]/5 hover:text-[#1a365d] dark:border-[#334155] dark:text-gray-300 dark:hover:border-[#d4a843] dark:hover:bg-[#d4a843]/5 dark:hover:text-[#d4a843]"
            >
              <Plus className="h-4 w-4" />
              Yeni Ürün Ekle
            </Link>
            <Link
              href="/admin/kategoriler"
              className="flex w-full items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-[#1a365d] hover:bg-[#1a365d]/5 hover:text-[#1a365d] dark:border-[#334155] dark:text-gray-300 dark:hover:border-[#d4a843] dark:hover:bg-[#d4a843]/5 dark:hover:text-[#d4a843]"
            >
              <Tags className="h-4 w-4" />
              Yeni Kategori
            </Link>
            <a
              href="/pars-tabela"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-[#1a365d] hover:bg-[#1a365d]/5 hover:text-[#1a365d] dark:border-[#334155] dark:text-gray-300 dark:hover:border-[#d4a843] dark:hover:bg-[#d4a843]/5 dark:hover:text-[#d4a843]"
            >
              <ExternalLink className="h-4 w-4" />
              Siteyi Gör
            </a>
          </div>

          {/* Inquiry stats */}
          <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-gray-50 p-4 dark:border-[#334155] dark:bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Talepler</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#1a365d] dark:text-white">{totalInquiries}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">toplam</span>
              {newInquiries > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                  {newInquiries} yeni
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Products + Recent Inquiries */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Products */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4 dark:border-[#334155]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Son Eklenen Ürünler</h2>
            <Link
              href="/admin/urunler"
              className="text-sm font-medium text-[#1a365d] transition-colors hover:text-[#1a365d]/70 dark:text-[#d4a843] dark:hover:text-[#d4a843]/80"
            >
              Tümünü Gör
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-gray-500 dark:text-gray-400">Henüz ürün eklenmemis</p>
              <Link
                href="/admin/urunler/yeni"
                className="mt-3 inline-block text-sm font-medium text-[#1a365d] hover:underline dark:text-[#d4a843]"
              >
                Ilk ürünü ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-left dark:border-[#334155]">
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Görsel</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ürün Adi</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Kategori</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fiyat</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Durum</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tarih</th>
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
                            <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/urunler/${product.id}`}
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
                          {product.price ? `${Number(product.price).toLocaleString('tr-TR')} \u20BA` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge published={product.published} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(product.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4 dark:border-[#334155]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Son Talepler</h2>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-gray-500 dark:text-gray-400">Henüz talep yok</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {inquiry.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {inquiry.message}
                      </p>
                    </div>
                    <InquiryStatusBadge status={inquiry.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(inquiry.createdAt)}
                    </span>
                    {inquiry.product && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        &middot; {inquiry.product.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
