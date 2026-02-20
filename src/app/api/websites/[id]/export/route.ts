import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { exportWebsite } from '@/lib/export';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/websites/[id]/export
 * Export a website as a standalone Next.js project and push to GitHub.
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check that website has pages
    const pageCount = await prisma.page.count({
      where: { websiteId: id },
    });

    if (pageCount === 0) {
      return NextResponse.json({ error: 'Website has no pages to export' }, { status: 400 });
    }

    const result = await exportWebsite({
      websiteId: id,
      userId: session.user.id,
    });

    return NextResponse.json({
      message: 'Website exported successfully',
      repoUrl: result.repoUrl,
      repoName: result.repoName,
    });
  } catch (error) {
    console.error('Error exporting website:', error);
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 });
  }
}
