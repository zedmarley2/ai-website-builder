'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';

interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  order?: number;
}

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(
    data: { name: string; description: string; price: string; categoryId: string; featured: boolean; published: boolean },
    images: ProductImage[]
  ) {
    // Create the product
    const productRes = await fetch('/api/admin/products', {
      method: 'POST',
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
      throw new Error(err.error || 'Urun olusturulamadi');
    }

    const { data: product } = await productRes.json();

    // Add images if any
    if (images.length > 0) {
      await Promise.all(
        images.map((img, index) =>
          fetch(`/api/admin/products/${product.id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: img.url,
              alt: img.alt || data.name,
              order: index,
            }),
          })
        )
      );
    }

    router.push('/admin/products');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Yeni Urun Ekle</h1>
        <p className="mt-1 text-sm text-gray-400">Yeni bir urun olusturun</p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <ProductForm onSubmit={handleSubmit} isEditing={false} />
      </div>
    </div>
  );
}
