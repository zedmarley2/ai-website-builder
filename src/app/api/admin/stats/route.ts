import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/stats
 * Return dashboard statistics.
 */
export async function GET() {
  try {
    const { error, status } = await requireAdmin();
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const [totalProducts, totalCategories, publishedProducts, featuredProducts, recentProducts] =
      await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.product.count({ where: { published: true } }),
        prisma.product.count({ where: { featured: true } }),
        prisma.product.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        }),
      ]);

    return NextResponse.json({
      data: {
        totalProducts,
        totalCategories,
        publishedProducts,
        featuredProducts,
        recentProducts,
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
