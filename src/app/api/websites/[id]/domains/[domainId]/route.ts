import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string; domainId: string }>;
}

/**
 * DELETE /api/websites/[id]/domains/[domainId]
 * Remove a custom domain from a website.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, domainId } = await context.params;

    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain || domain.websiteId !== id) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    await prisma.domain.delete({
      where: { id: domainId },
    });

    return NextResponse.json({ message: 'Domain removed' });
  } catch (error) {
    console.error('Error removing domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
