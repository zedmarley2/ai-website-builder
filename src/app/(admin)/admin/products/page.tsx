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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (publishedFilter) params.set('published', publishedFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data ?? []);
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      // Network error - products stay empty
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, publishedFilter]);

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
      }
    } catch {
      // Silently fail
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
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Urunler</h1>
          <p className="mt-1 text-sm text-gray-400">
            Toplam {pagination.total} urun
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-5 py-2.5 text-sm font-semibold text-gray-950 transition-all hover:bg-[#00f0ff]/90"
          style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Urun Ekle
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Urun ara..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white transition-colors focus:border-[#00f0ff] focus:outline-none"
        >
          <option value="">Tum Kategoriler</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white transition-colors focus:border-[#00f0ff] focus:outline-none"
        >
          <option value="">Tum Durum</option>
          <option value="true">Yayinda</option>
          <option value="false">Taslak</option>
        </select>
      </div>

      {/* Products table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-[#00f0ff]" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">Urun bulunamadi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Gorsel</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Ad</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Kategori</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Fiyat</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Durum</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Islemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((product) => (
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
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      {product.featured && (
                        <span className="text-xs text-yellow-400">One Cikan</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{product.category.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-300">
                      {product.price ? `${Number(product.price).toLocaleString('tr-TR')} TL` : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => togglePublished(product)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          product.published
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                        }`}
                      >
                        {product.published ? 'Yayinda' : 'Taslak'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-[#00f0ff]/50 hover:text-[#00f0ff]"
                        >
                          Duzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(product.id)}
                          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-[#ff006e]/50 hover:text-[#ff006e]"
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
            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-40"
          >
            Onceki
          </button>
          <span className="px-3 text-sm text-gray-400">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchProducts(pagination.page + 1)}
            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-40"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-6"
            >
              <h3 className="text-lg font-semibold text-white">Urunu Sil</h3>
              <p className="mt-2 text-sm text-gray-400">
                Bu urunu silmek istediginize emin misiniz? Bu islem geri alinamaz.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex items-center gap-2 rounded-lg bg-[#ff006e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ff006e]/90 disabled:opacity-50"
                >
                  {deleting && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  Evet, Sil
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
                >
                  Iptal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
