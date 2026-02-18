import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { verifyDomainCNAME } from '@/lib/dns-verify';

interface RouteContext {
  params: Promise<{ id: string; domainId: string }>;
}

/**
 * POST /api/websites/[id]/domains/[domainId]/verify
 * Trigger DNS verification for a custom domain.
 */
export async function POST(_request: Request, context: RouteContext) {
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

    const isVerified = await verifyDomainCNAME(domain.domain);

    const updated = await prisma.domain.update({
      where: { id: domainId },
      data: {
        status: isVerified ? 'VERIFIED' : 'FAILED',
        verifiedAt: isVerified ? new Date() : null,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      verified: isVerified,
      status: updated.status,
      domain: updated,
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
