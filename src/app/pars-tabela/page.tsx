import prisma from '@/lib/prisma';
import { NeonHeader } from '@/components/pars-tabela/neon-header';
import { NeonHero } from '@/components/pars-tabela/neon-hero';
import { ServicesSection } from '@/components/pars-tabela/services-section';
import { ProductsGallery } from '@/components/pars-tabela/products-gallery';
import { AboutSection } from '@/components/pars-tabela/about-section';
import { ContactSection } from '@/components/pars-tabela/contact-section';
import { NeonFooter } from '@/components/pars-tabela/neon-footer';

export default async function ParsTabelaPage() {
  const [categories, featuredProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { published: true, featured: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true, alt: true }, orderBy: { order: 'asc' } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Serialize Decimal prices to strings for client component
  const serializedProducts = featuredProducts.map((p) => ({
    ...p,
    price: p.price ? p.price.toString() : null,
  }));

  return (
    <>
      <NeonHeader />
      <main>
        <NeonHero />
        <ServicesSection />
        <ProductsGallery products={serializedProducts} categories={categories} />
        <AboutSection />
        <ContactSection />
      </main>
      <NeonFooter />
    </>
  );
}
