import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateRequestSchema,
  ComponentType,
  type GenerateResponse,
  type GeneratedComponent,
} from "@/types";

/**
 * POST /api/generate
 * Accept a prompt and websiteId, then generate page content using AI.
 *
 * Currently returns mock/stub data. Replace the `generatePageFromPrompt`
 * function body with a real Claude API call when ready.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = generateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const { prompt, websiteId } = validation.data;

    // Verify the website exists and belongs to the user
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
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

    // Generate page content (currently stubbed)
    const generatedPage = await generatePageFromPrompt(prompt);

    const response: GenerateResponse = {
      success: true,
      message: "Page generated successfully",
      data: generatedPage,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// AI Generation Stub
// ---------------------------------------------------------------------------

/**
 * Generates a page structure from a natural-language prompt.
 *
 * TODO: Replace the mock implementation below with a real call to the
 * Anthropic Claude API. Example integration outline:
 *
 * ```ts
 * import Anthropic from "@anthropic-ai/sdk";
 *
 * const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
 *
 * const message = await client.messages.create({
 *   model: "claude-sonnet-4-20250514",
 *   max_tokens: 4096,
 *   system: "You are a website builder AI. Given a user prompt, return a JSON
 *            object describing the page structure with components...",
 *   messages: [{ role: "user", content: prompt }],
 * });
 *
 * // Parse the structured response and return it
 * ```
 */
async function generatePageFromPrompt(
  prompt: string,
): Promise<{ pageName: string; slug: string; components: GeneratedComponent[] }> {
  // Derive a simple page name and slug from the prompt
  const words = prompt.trim().split(/\s+/).slice(0, 4);
  const pageName =
    words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") +
    " Page";
  const slug = words.map((w) => w.toLowerCase()).join("-") + "-page";

  // Return a realistic mock page structure
  const components: GeneratedComponent[] = [
    {
      type: ComponentType.HEADER,
      name: "Site Header",
      props: {
        logo: "My Website",
        navItems: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
      styles: {
        backgroundColor: "#ffffff",
        padding: "1rem 2rem",
        borderBottom: "1px solid #e5e7eb",
      },
      order: 0,
    },
    {
      type: ComponentType.HERO,
      name: "Hero Section",
      props: {
        title: `Welcome to Your New Website`,
        subtitle: `Generated from prompt: "${prompt}"`,
        ctaText: "Get Started",
        ctaLink: "#features",
        backgroundImage: null,
      },
      styles: {
        backgroundColor: "#1e40af",
        color: "#ffffff",
        padding: "6rem 2rem",
        textAlign: "center",
      },
      order: 1,
    },
    {
      type: ComponentType.FEATURES,
      name: "Features Section",
      props: {
        heading: "What We Offer",
        features: [
          {
            title: "Fast Performance",
            description:
              "Lightning-fast load times that keep your visitors engaged.",
            icon: "zap",
          },
          {
            title: "Modern Design",
            description:
              "Clean, contemporary aesthetics that make an impression.",
            icon: "palette",
          },
          {
            title: "Fully Responsive",
            description:
              "Looks great on every device, from mobile to desktop.",
            icon: "smartphone",
          },
        ],
      },
      styles: {
        padding: "4rem 2rem",
        backgroundColor: "#f9fafb",
      },
      order: 2,
    },
    {
      type: ComponentType.CTA,
      name: "Call to Action",
      props: {
        heading: "Ready to Get Started?",
        description:
          "Join thousands of satisfied customers and transform your online presence today.",
        buttonText: "Sign Up Now",
        buttonLink: "/signup",
      },
      styles: {
        padding: "4rem 2rem",
        backgroundColor: "#1e40af",
        color: "#ffffff",
        textAlign: "center",
      },
      order: 3,
    },
    {
      type: ComponentType.FOOTER,
      name: "Site Footer",
      props: {
        copyright: `© ${new Date().getFullYear()} My Website. All rights reserved.`,
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Contact", href: "/contact" },
        ],
      },
      styles: {
        backgroundColor: "#111827",
        color: "#9ca3af",
        padding: "2rem",
        textAlign: "center",
      },
      order: 4,
    },
  ];

  return {
    pageName,
    slug,
    components,
  };
}
