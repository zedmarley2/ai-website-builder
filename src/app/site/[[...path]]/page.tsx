import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ComponentRenderer } from '@/components/site/component-renderer';
import type { Metadata } from 'next';

export const revalidate = 60;

interface SitePageProps {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ __subdomain?: string; __domain?: string }>;
}

async function getWebsiteByHostname(subdomain?: string, domain?: string) {
  if (subdomain) {
    return prisma.website.findFirst({
      where: { subdomain, published: true },
      include: {
        pages: {
          orderBy: { order: 'asc' },
          include: {
            components: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  if (domain) {
    const domainRecord = await prisma.domain.findFirst({
      where: { domain, status: 'VERIFIED' },
      include: {
        website: {
          include: {
            pages: {
              orderBy: { order: 'asc' },
              include: {
                components: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!domainRecord || !domainRecord.website.published) {
      return null;
    }

    return domainRecord.website;
  }

  return null;
}

export async function generateMetadata({ searchParams }: SitePageProps): Promise<Metadata> {
  const { __subdomain, __domain } = await searchParams;
  const website = await getWebsiteByHostname(__subdomain, __domain);

  if (!website) return {};

  return {
    title: website.name,
    description: website.description ?? undefined,
  };
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const { path } = await params;
  const { __subdomain, __domain } = await searchParams;

  const website = await getWebsiteByHostname(__subdomain, __domain);

  if (!website) {
    notFound();
  }

  // Determine which page to render
  // path is undefined for root, or ["about"] for /about, etc.
  const slug = path?.[0];

  let page;
  if (!slug) {
    // Root path — find the home page
    page = website.pages.find((p) => p.isHomePage) ?? website.pages[0];
  } else {
    page = website.pages.find((p) => p.slug === slug);
  }

  if (!page) {
    notFound();
  }

  return (
    <main>
      {page.components.map((component) => (
        <ComponentRenderer
          key={component.id}
          component={{
            id: component.id,
            type: component.type,
            name: component.name,
            props: (component.props as Record<string, unknown>) ?? {},
            styles: (component.styles as Record<string, unknown>) ?? {},
          }}
        />
      ))}
    </main>
  );
}
