'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  categoryId: string;
  featured: boolean;
  published: boolean;
  category: Category;
  images: ProductImage[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, type: 'success' | 'error') {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data ?? []);
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      showToast('Ürünler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data ?? []);
        }
      } catch {
        // Silently fail
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(1), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        showToast('Ürün başarıyla silindi', 'success');
      } else {
        showToast('Ürün silinirken hata oluştu', 'error');
      }
    } catch {
      showToast('Ürün silinirken hata oluştu', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  }

  async function togglePublished(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !product.published }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, published: !p.published } : p))
        );
        showToast(
          product.published ? 'Ürün taslağa alındı' : 'Ürün yayına alındı',
          'success'
        );
      }
    } catch {
      showToast('Durum güncellenirken hata oluştu', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yönetim Paneli / <span className="text-[#1a365d] dark:text-[#d4a843]">Ürünler</span>
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ürünler</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Toplam {pagination.total} ürün
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a365d]/90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#1a365d] focus:outline-none dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#d4a843]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-[#1a365d] focus:outline-none dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:focus:border-[#d4a843]"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products table */}
      <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a365d] dark:border-gray-700 dark:border-t-[#d4a843]" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Ürün bulunamadı.</p>
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
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
                {products.map((product) => (
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                      {product.featured && (
                        <span className="text-xs font-medium text-[#d4a843]">Öne Çıkan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {product.price ? `${Number(product.price).toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => togglePublished(product)}
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                        style={{ backgroundColor: product.published ? '#22c55e' : '#94a3b8' }}
                        role="switch"
                        aria-checked={product.published}
                        aria-label={product.published ? 'Yayında' : 'Taslak'}
                      >
                        <span
                          className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200"
                          style={{ transform: product.published ? 'translateX(1.25rem)' : 'translateX(0)' }}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#1a365d] hover:text-[#1a365d] dark:border-[#334155] dark:text-gray-300 dark:hover:border-[#d4a843] dark:hover:text-[#d4a843]"
                        >
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(product.id)}
                          className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-red-300 hover:text-red-600 dark:border-[#334155] dark:text-gray-300 dark:hover:border-red-500/30 dark:hover:text-red-400"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => fetchProducts(pagination.page - 1)}
            className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-[#334155] dark:text-gray-300 dark:hover:bg-white/5"
          >
            Önceki
          </button>
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchProducts(pagination.page + 1)}
            className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-[#334155] dark:text-gray-300 dark:hover:bg-white/5"
          >
            Sonraki
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#334155] dark:bg-[#1e293b]"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white">Ürünü Sil</h3>
              <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#334155] dark:text-gray-300 dark:hover:bg-white/5"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
