'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductForm } from '@/components/admin/product-form';

interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  order?: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  categoryId: string;
  featured: boolean;
  published: boolean;
  images: ProductImage[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) {
          setError('Ürün bulunamadı');
          return;
        }
        const data = await res.json();
        setProduct(data.data);
      } catch {
        setError('Ürün yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  async function handleSubmit(
    data: { name: string; description: string; price: string; categoryId: string; featured: boolean; published: boolean },
    images: ProductImage[]
  ) {
    const productRes = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description || undefined,
        price: data.price ? Number(data.price) : undefined,
        categoryId: data.categoryId,
        featured: data.featured,
        published: data.published,
      }),
    });

    if (!productRes.ok) {
      const err = await productRes.json();
      throw new Error(err.error || 'Ürün güncellenemedi');
    }

    const existingImages = product?.images ?? [];
    const existingIds = new Set(existingImages.map((img) => img.id).filter(Boolean));
    const newImageIds = new Set(images.map((img) => img.id).filter(Boolean));

    const toDelete = existingImages.filter((img) => img.id && !newImageIds.has(img.id));
    await Promise.all(
      toDelete.map((img) =>
        fetch(`/api/admin/products/${productId}/images?imageId=${img.id}`, {
          method: 'DELETE',
        })
      )
    );

    const toAdd = images.filter((img) => !img.id || !existingIds.has(img.id));
    await Promise.all(
      toAdd.map((img) =>
        fetch(`/api/admin/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: img.url,
            alt: img.alt || data.name,
            order: images.indexOf(img),
          }),
        })
      )
    );

    router.push('/admin/products');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/products');
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a365d] dark:border-gray-700 dark:border-t-[#d4a843]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <svg className="mx-auto h-12 w-12 text-red-300 dark:text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="mt-3 text-red-600 dark:text-red-400">{error || 'Ürün bulunamadı'}</p>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="mt-4 text-sm font-medium text-[#1a365d] hover:underline dark:text-[#d4a843]"
        >
          Ürünlere dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link href="/admin" className="hover:text-[#1a365d] dark:hover:text-[#d4a843]">Yönetim Paneli</Link>
          {' / '}
          <Link href="/admin/products" className="hover:text-[#1a365d] dark:hover:text-[#d4a843]">Ürünler</Link>
          {' / '}
          <span className="text-[#1a365d] dark:text-[#d4a843]">Düzenle</span>
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ürünü Düzenle</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Ürünü Sil
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
        <ProductForm
          initialData={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            categoryId: product.categoryId,
            featured: product.featured,
            published: product.published,
            images: product.images,
          }}
          onSubmit={handleSubmit}
          isEditing
        />
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
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
                &quot;{product.name}&quot; ürününü silmek istediğinize emin misiniz? Tüm görseller de silinecektir. Bu işlem geri alınamaz.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#334155] dark:text-gray-300 dark:hover:bg-white/5"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
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
    </div>
  );
}
