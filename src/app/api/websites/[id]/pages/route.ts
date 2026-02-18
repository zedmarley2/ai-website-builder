import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createPageSchema } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/websites/[id]/pages
 * List all pages for a website.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify website exists and user owns it
    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 },
      );
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      where: { websiteId: id },
      include: {
        components: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/websites/[id]/pages
 * Create a new page for a website.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify website exists and user owns it
    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 },
      );
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const { name, slug, isHomePage, content } = validation.data;

    // Check if slug is already used in this website
    const existingPage = await prisma.page.findUnique({
      where: {
        websiteId_slug: {
          websiteId: id,
          slug,
        },
      },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists for this website" },
        { status: 409 },
      );
    }

    // If this page is set as the home page, unset any existing home page
    if (isHomePage) {
      await prisma.page.updateMany({
        where: { websiteId: id, isHomePage: true },
        data: { isHomePage: false },
      });
    }

    // Determine the next order value
    const lastPage = await prisma.page.findFirst({
      where: { websiteId: id },
      orderBy: { order: "desc" },
    });

    const page = await prisma.page.create({
      data: {
        name,
        slug,
        isHomePage: isHomePage ?? false,
        content: content as unknown as undefined,
        order: lastPage ? lastPage.order + 1 : 0,
        websiteId: id,
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
