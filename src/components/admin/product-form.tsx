'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/admin/image-upload';

interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  order?: number;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  featured: boolean;
  published: boolean;
}

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    price: string | number | null;
    categoryId: string;
    featured: boolean;
    published: boolean;
    images: ProductImage[];
  };
  onSubmit: (data: ProductFormData, images: ProductImage[]) => Promise<void>;
  isEditing: boolean;
}

export function ProductForm({ initialData, onSubmit, isEditing }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? []);

  const [form, setForm] = useState<ProductFormData>({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price != null ? String(initialData.price) : '',
    categoryId: initialData?.categoryId ?? '',
    featured: initialData?.featured ?? false,
    published: initialData?.published ?? true,
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data ?? []);
        }
      } catch {
        // Silently fail - categories dropdown will be empty
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Urun adi gereklidir';
    }
    if (!form.categoryId) {
      newErrors.categoryId = 'Kategori secimi gereklidir';
    }
    if (form.price && (isNaN(Number(form.price)) || Number(form.price) <= 0)) {
      newErrors.price = 'Gecerli bir fiyat giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(form, images);
    } catch {
      setErrors({ submit: 'Bir hata olustu. Lutfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof ProductFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="rounded-lg border border-[#ff006e]/30 bg-[#ff006e]/10 px-4 py-3">
          <p className="text-sm text-[#ff006e]">{errors.submit}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">
              Urun Adi *
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:outline-none ${
                errors.name ? 'border-[#ff006e]' : 'border-gray-700 focus:border-[#00f0ff]'
              }`}
              placeholder="Urun adini giriniz"
            />
            {errors.name && <p className="mt-1 text-sm text-[#ff006e]">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-300">
              Aciklama
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
              placeholder="Urun aciklamasini giriniz"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-gray-300">
              Fiyat (TL)
            </label>
            <input
              id="price"
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:outline-none ${
                errors.price ? 'border-[#ff006e]' : 'border-gray-700 focus:border-[#00f0ff]'
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="mt-1 text-sm text-[#ff006e]">{errors.price}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-gray-300">
              Kategori *
            </label>
            {categoriesLoading ? (
              <div className="flex h-11 items-center rounded-lg border border-gray-700 bg-gray-800 px-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-[#00f0ff]" />
                <span className="ml-2 text-sm text-gray-500">Kategoriler yukleniyor...</span>
              </div>
            ) : (
              <select
                id="categoryId"
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-white transition-colors focus:outline-none ${
                  errors.categoryId ? 'border-[#ff006e]' : 'border-gray-700 focus:border-[#00f0ff]'
                }`}
              >
                <option value="">Kategori seciniz</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            {errors.categoryId && <p className="mt-1 text-sm text-[#ff006e]">{errors.categoryId}</p>}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateField('featured', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-700 transition-colors peer-checked:bg-[#00f0ff]/30" />
                <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-gray-400 transition-all peer-checked:translate-x-5 peer-checked:bg-[#00f0ff]" />
              </div>
              <span className="text-sm text-gray-300">One Cikan</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => updateField('published', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-700 transition-colors peer-checked:bg-[#00f0ff]/30" />
                <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-gray-400 transition-all peer-checked:translate-x-5 peer-checked:bg-[#00f0ff]" />
              </div>
              <span className="text-sm text-gray-300">Yayinda</span>
            </label>
          </div>
        </div>

        {/* Right column - Images */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Gorseller</label>
          <ImageUpload images={images} onImagesChange={setImages} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-gray-800 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-6 py-2.5 text-sm font-semibold text-gray-950 transition-all hover:bg-[#00f0ff]/90 disabled:opacity-50"
          style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
        >
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-950/30 border-t-gray-950" />
          )}
          {isEditing ? 'Guncelle' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
        >
          Iptal
        </button>
      </div>
    </form>
  );
}
