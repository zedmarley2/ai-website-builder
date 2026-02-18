'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      throw new Error(err.error || 'Ürün oluşturulamadı');
    }

    const { data: product } = await productRes.json();

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
      {/* Breadcrumb */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link href="/admin" className="hover:text-[#1a365d] dark:hover:text-[#d4a843]">Yönetim Paneli</Link>
          {' / '}
          <Link href="/admin/products" className="hover:text-[#1a365d] dark:hover:text-[#d4a843]">Ürünler</Link>
          {' / '}
          <span className="text-[#1a365d] dark:text-[#d4a843]">Yeni Ürün</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Yeni Ürün Ekle</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Yeni bir ürün oluşturun</p>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
        <ProductForm onSubmit={handleSubmit} isEditing={false} />
      </div>
    </div>
  );
}
