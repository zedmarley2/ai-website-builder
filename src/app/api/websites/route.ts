import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createWebsiteSchema } from '@/types';

/**
 * GET /api/websites
 * List all websites for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const websites = await prisma.website.findMany({
      where: { userId: session.user.id },
      include: {
        pages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/websites
 * Create a new website for the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createWebsiteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, description, subdomain } = validation.data;

    // Check if subdomain is already taken
    const existingWebsite = await prisma.website.findUnique({
      where: { subdomain },
    });

    if (existingWebsite) {
      return NextResponse.json({ error: 'Subdomain is already taken' }, { status: 409 });
    }

    const website = await prisma.website.create({
      data: {
        name,
        description,
        subdomain,
        userId: session.user.id,
      },
      include: {
        pages: true,
      },
    });

    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error('Error creating website:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
