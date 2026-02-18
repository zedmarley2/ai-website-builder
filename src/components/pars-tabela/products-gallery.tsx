'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  price: string | number | null;
  categoryId: string;
  category: CategoryItem;
  images: ProductImage[];
}

interface ProductsGalleryProps {
  products: ProductItem[];
  categories: CategoryItem[];
}

const GRADIENT_COLORS = [
  'from-[#00f0ff]/30 to-[#00f0ff]/5',
  'from-[#ff006e]/30 to-[#ff006e]/5',
  'from-[#39ff14]/30 to-[#39ff14]/5',
  'from-violet-500/30 to-violet-500/5',
];

export function ProductsGallery({ products, categories }: ProductsGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredProducts = activeCategory
    ? products.filter((p) => p.categoryId === activeCategory)
    : products;

  return (
    <section id="urunlerimiz" className="bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2
            className="text-4xl font-bold text-[#00f0ff] sm:text-5xl"
            style={{
              textShadow: '0 0 7px #00f0ff, 0 0 10px #00f0ff, 0 0 21px #00f0ff',
            }}
          >
            Ürünlerimiz
          </h2>
          <p className="mt-4 text-lg text-gray-400">En son projelerimiz ve ürünlerimiz</p>
        </div>

        {/* Category filters */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              activeCategory === null
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'border border-gray-700 text-gray-400 hover:border-[#00f0ff] hover:text-[#00f0ff]'
            }`}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'border border-gray-700 text-gray-400 hover:border-[#00f0ff] hover:text-[#00f0ff]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f0ff]/50"
                whileHover={{
                  boxShadow: '0 0 20px rgba(0,240,255,0.2), 0 0 40px rgba(0,240,255,0.1)',
                }}
              >
                {/* Image or gradient placeholder */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]}`}
                    >
                      <span className="text-5xl opacity-50">💡</span>
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-5">
                  <span className="mb-2 inline-block rounded-full bg-[#00f0ff]/10 px-3 py-1 text-xs font-medium text-[#00f0ff]">
                    {product.category.name}
                  </span>
                  <h3 className="mb-1 text-lg font-semibold text-white">{product.name}</h3>
                  {product.price && (
                    <p className="text-sm font-medium text-[#39ff14]">
                      ₺{' '}
                      {typeof product.price === 'number'
                        ? product.price.toLocaleString('tr-TR')
                        : Number(product.price).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <p className="mt-12 text-center text-gray-500">Bu kategoride henüz ürün bulunmuyor.</p>
        )}

        {/* View all button */}
        <div className="mt-12 text-center">
          <a
            href="/pars-tabela/urunlerimiz"
            className="inline-block rounded-full border-2 border-[#00f0ff] px-8 py-3 text-lg font-semibold text-[#00f0ff] transition-all duration-300 hover:bg-[#00f0ff]/10"
            style={{
              boxShadow: '0 0 15px rgba(0,240,255,0.3), inset 0 0 15px rgba(0,240,255,0.1)',
            }}
          >
            Tüm Ürünleri Gör
          </a>
        </div>
      </div>
    </section>
  );
}
