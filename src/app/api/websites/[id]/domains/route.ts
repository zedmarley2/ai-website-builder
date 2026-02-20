import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { addDomainSchema } from '@/types';
import { getCNAMETarget } from '@/lib/dns-verify';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/websites/[id]/domains
 * List all custom domains for a website.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const domains = await prisma.domain.findMany({
      where: { websiteId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      domains,
      cnameTarget: getCNAMETarget(website.subdomain),
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/websites/[id]/domains
 * Add a custom domain to a website.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = addDomainSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { domain: domainName } = validation.data;

    // Check if domain is already registered
    const existing = await prisma.domain.findUnique({
      where: { domain: domainName },
    });

    if (existing) {
      return NextResponse.json({ error: 'Domain is already in use' }, { status: 409 });
    }

    const domain = await prisma.domain.create({
      data: {
        domain: domainName,
        websiteId: id,
        status: 'PENDING',
      },
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error('Error adding domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
