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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
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

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [autoSlug, setAutoSlug] = useState(true);

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
      setFormError('Kategori adi gereklidir');
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
        setFormError(data.error || 'Bir hata olustu');
        return;
      }

      resetForm();
      fetchCategories();
    } catch {
      setFormError('Bir hata olustu. Lutfen tekrar deneyin.');
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
        setFormError(data.error || 'Silinemedi');
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      setFormError('Silme sirasinda hata olustu');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kategoriler</h1>
          <p className="mt-1 text-sm text-gray-400">
            Toplam {categories.length} kategori
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-5 py-2.5 text-sm font-semibold text-gray-950 transition-all hover:bg-[#00f0ff]/90"
            style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Kategori
          </button>
        )}
      </div>

      {/* Form error outside the form */}
      {formError && !showForm && (
        <div className="rounded-lg border border-[#ff006e]/30 bg-[#ff006e]/10 px-4 py-3">
          <p className="text-sm text-[#ff006e]">{formError}</p>
        </div>
      )}

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {editingId ? 'Kategori Duzenle' : 'Yeni Kategori'}
              </h2>

              {formError && (
                <div className="mb-4 rounded-lg border border-[#ff006e]/30 bg-[#ff006e]/10 px-4 py-3">
                  <p className="text-sm text-[#ff006e]">{formError}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Ad *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
                    placeholder="Kategori adi"
                  />
                </div>
                <div>
                  <label htmlFor="cat-slug" className="mb-1.5 block text-sm font-medium text-gray-300">
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
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
                    placeholder="kategori-slug"
                  />
                </div>
                <div>
                  <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Aciklama
                  </label>
                  <input
                    id="cat-desc"
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
                    placeholder="Kategori aciklamasi"
                  />
                </div>
                <div>
                  <label htmlFor="cat-order" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Sira
                  </label>
                  <input
                    id="cat-order"
                    type="number"
                    min="0"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-5 py-2.5 text-sm font-semibold text-gray-950 transition-all hover:bg-[#00f0ff]/90 disabled:opacity-50"
                  style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
                >
                  {saving && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-950/30 border-t-gray-950" />
                  )}
                  {editingId ? 'Guncelle' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
                >
                  Iptal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-[#00f0ff]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">Henuz kategori eklenmemis.</p>
            <button
              type="button"
              onClick={startNew}
              className="mt-3 text-sm text-[#00f0ff] hover:text-[#00f0ff]/80"
            >
              Ilk kategoriyi ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Sira</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Ad</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Urun Sayisi</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Islemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {categories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm text-gray-400">{cat.order}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white">{cat.name}</p>
                      {cat.description && (
                        <p className="mt-0.5 text-xs text-gray-500 truncate max-w-xs">{cat.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <code className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{cat.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-[#00f0ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#00f0ff]">
                        {cat._count.products}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-[#00f0ff]/50 hover:text-[#00f0ff]"
                        >
                          Duzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(cat.id)}
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
              <h3 className="text-lg font-semibold text-white">Kategoriyi Sil</h3>
              {(() => {
                const cat = categories.find((c) => c.id === deleteConfirm);
                if (cat && cat._count.products > 0) {
                  return (
                    <p className="mt-2 text-sm text-yellow-400">
                      Bu kategoride {cat._count.products} urun bulunmaktadir. Silmeden once urunleri baska bir kategoriye tasiyiniz.
                    </p>
                  );
                }
                return (
                  <p className="mt-2 text-sm text-gray-400">
                    Bu kategoriyi silmek istediginize emin misiniz? Bu islem geri alinamaz.
                  </p>
                );
              })()}
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={deleting || (categories.find((c) => c.id === deleteConfirm)?._count.products ?? 0) > 0}
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
