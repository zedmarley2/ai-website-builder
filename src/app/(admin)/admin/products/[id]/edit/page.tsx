'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
          setError('Urun bulunamadi');
          return;
        }
        const data = await res.json();
        setProduct(data.data);
      } catch {
        setError('Urun yuklenirken hata olustu');
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
    // Update the product
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
      throw new Error(err.error || 'Urun guncellenemedi');
    }

    // Sync images: delete removed ones, add new ones
    const existingImages = product?.images ?? [];
    const existingIds = new Set(existingImages.map((img) => img.id).filter(Boolean));
    const newImageIds = new Set(images.map((img) => img.id).filter(Boolean));

    // Delete removed images
    const toDelete = existingImages.filter((img) => img.id && !newImageIds.has(img.id));
    await Promise.all(
      toDelete.map((img) =>
        fetch(`/api/admin/products/${productId}/images?imageId=${img.id}`, {
          method: 'DELETE',
        })
      )
    );

    // Add new images (ones without an id or not in existing set)
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-[#00f0ff]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#ff006e]">{error || 'Urun bulunamadi'}</p>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="mt-4 text-sm text-[#00f0ff] hover:text-[#00f0ff]/80"
        >
          Urunlere don
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Urunu Duzenle</h1>
          <p className="mt-1 text-sm text-gray-400">{product.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg border border-[#ff006e]/30 px-4 py-2 text-sm font-medium text-[#ff006e] transition-colors hover:bg-[#ff006e]/10"
        >
          Urunu Sil
        </button>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowDeleteModal(false)}
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
                &quot;{product.name}&quot; urununu silmek istediginize emin misiniz? Tum gorseller de silinecektir. Bu islem geri alinamaz.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-lg bg-[#ff006e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ff006e]/90 disabled:opacity-50"
                >
                  {deleting && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  Evet, Sil
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
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
