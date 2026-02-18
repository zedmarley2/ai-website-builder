import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateWebsiteSchema } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/websites/[id]
 * Get a website by ID with its pages and components.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { order: "asc" },
          include: {
            components: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
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

    return NextResponse.json(website);
  } catch (error) {
    console.error("Error fetching website:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/websites/[id]
 * Update a website by ID.
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existingWebsite = await prisma.website.findUnique({
      where: { id },
    });

    if (!existingWebsite) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 },
      );
    }

    if (existingWebsite.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateWebsiteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const data = validation.data;

    // If updating subdomain, check it is not already taken by another website
    if (data.subdomain && data.subdomain !== existingWebsite.subdomain) {
      const subdomainTaken = await prisma.website.findUnique({
        where: { subdomain: data.subdomain },
      });

      if (subdomainTaken) {
        return NextResponse.json(
          { error: "Subdomain is already taken" },
          { status: 409 },
        );
      }
    }

    const website = await prisma.website.update({
      where: { id },
      data,
      include: {
        pages: {
          orderBy: { order: "asc" },
          include: {
            components: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(website);
  } catch (error) {
    console.error("Error updating website:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/websites/[id]
 * Delete a website by ID.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existingWebsite = await prisma.website.findUnique({
      where: { id },
    });

    if (!existingWebsite) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 },
      );
    }

    if (existingWebsite.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.website.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Website deleted successfully" });
  } catch (error) {
    console.error("Error deleting website:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
