'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  _count: { products: number };
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [autoSlug, setAutoSlug] = useState(true);

  function showToast(message: string, type: 'success' | 'error') {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function resetForm() {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormOrder('0');
    setAutoSlug(true);
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(cat: Category) {
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description ?? '');
    setFormOrder(String(cat.order));
    setAutoSlug(false);
    setEditingId(cat.id);
    setShowForm(true);
    setFormError(null);
  }

  function startNew() {
    resetForm();
    setShowForm(true);
  }

  function handleNameChange(value: string) {
    setFormName(value);
    if (autoSlug) {
      setFormSlug(slugify(value));
    }
  }

  async function handleSave() {
    if (!formName.trim()) {
      setFormError('Kategori adı gereklidir');
      return;
    }
    if (!formSlug.trim()) {
      setFormError('Slug gereklidir');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body = {
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim() || undefined,
        order: parseInt(formOrder, 10) || 0,
      };

      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Bir hata oluştu');
        return;
      }

      showToast(editingId ? 'Kategori güncellendi' : 'Kategori oluşturuldu', 'success');
      resetForm();
      fetchCategories();
    } catch {
      setFormError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Silinemedi', 'error');
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('Kategori silindi', 'success');
      }
    } catch {
      showToast('Silme sırasında hata oluştu', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yönetim Paneli / <span className="text-[#1a365d] dark:text-[#d4a843]">Kategoriler</span>
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriler</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Toplam {categories.length} kategori
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a365d]/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Kategori
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </h2>

              {formError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ad *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#1a365d] focus:outline-none dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#d4a843]"
                    placeholder="Kategori adı"
                  />
                </div>
                <div>
                  <label htmlFor="cat-slug" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Slug *
                  </label>
                  <input
                    id="cat-slug"
                    type="text"
                    value={formSlug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setFormSlug(e.target.value);
                    }}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#1a365d] focus:outline-none dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#d4a843]"
                    placeholder="kategori-slug"
                  />
                </div>
                <div>
                  <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Açıklama
                  </label>
                  <input
                    id="cat-desc"
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#1a365d] focus:outline-none dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#d4a843]"
                    placeholder="Kategori açıklaması"
                  />
                </div>
                <div>
                  <label htmlFor="cat-order" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sıra
                  </label>
                  <input
                    id="cat-order"
                    type="number"
                    min="0"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#1a365d] focus:outline-none dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#d4a843]"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a365d]/90 disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-[#e2e8f0] px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#334155] dark:text-gray-300 dark:hover:bg-white/5"
                >
                  İptal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories table */}
      <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a365d] dark:border-gray-700 dark:border-t-[#d4a843]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Henüz kategori eklenmemiş.</p>
            <button
              type="button"
              onClick={startNew}
              className="mt-3 text-sm font-medium text-[#1a365d] hover:underline dark:text-[#d4a843]"
            >
              İlk kategoriyi ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-left dark:border-[#334155]">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Sıra</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ad</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ürün Sayısı</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{cat.order}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
                      {cat.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-400">{cat.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#1a365d]/10 px-2.5 py-0.5 text-xs font-medium text-[#1a365d] dark:bg-[#d4a843]/20 dark:text-[#d4a843]">
                        {cat._count.products}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#1a365d] hover:text-[#1a365d] dark:border-[#334155] dark:text-gray-300 dark:hover:border-[#d4a843] dark:hover:text-[#d4a843]"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(cat.id)}
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
              <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white">Kategoriyi Sil</h3>
              {(() => {
                const cat = categories.find((c) => c.id === deleteConfirm);
                if (cat && cat._count.products > 0) {
                  return (
                    <p className="mt-2 text-center text-sm text-amber-600 dark:text-amber-400">
                      Bu kategoride {cat._count.products} ürün bulunmaktadır. Silmeden önce ürünleri başka bir kategoriye taşıyınız.
                    </p>
                  );
                }
                return (
                  <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                    Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                  </p>
                );
              })()}
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
                  disabled={deleting || (categories.find((c) => c.id === deleteConfirm)?._count.products ?? 0) > 0}
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
