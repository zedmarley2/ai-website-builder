import { z } from "zod";

// ---------------------------------------------------------------------------
// Component Type Enum
// ---------------------------------------------------------------------------

export const ComponentType = {
  HERO: "HERO",
  HEADER: "HEADER",
  FOOTER: "FOOTER",
  SECTION: "SECTION",
  CTA: "CTA",
  FEATURES: "FEATURES",
  TESTIMONIALS: "TESTIMONIALS",
  PRICING: "PRICING",
  CONTACT: "CONTACT",
  GALLERY: "GALLERY",
  TEXT: "TEXT",
  IMAGE: "IMAGE",
} as const;

export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

export const componentTypeValues = Object.values(ComponentType) as [
  string,
  ...string[],
];

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const createWebsiteSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain must be 63 characters or fewer")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen",
    ),
});

export const updateWebsiteSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain must be 63 characters or fewer")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen",
    )
    .optional(),
  published: z.boolean().optional(),
});

export const createPageSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  isHomePage: z.boolean().optional().default(false),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const generateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt must be 2000 characters or fewer"),
  websiteId: z.string().uuid("Invalid website ID"),
});

// ---------------------------------------------------------------------------
// Inferred Input Types from Zod Schemas
// ---------------------------------------------------------------------------

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// ---------------------------------------------------------------------------
// Response / Domain Types
// ---------------------------------------------------------------------------

export interface ComponentData {
  id: string;
  type: ComponentType;
  name: string;
  props: Record<string, unknown> | null;
  styles: Record<string, unknown> | null;
  order: number;
  pageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageWithComponents {
  id: string;
  name: string;
  slug: string;
  order: number;
  content: Record<string, unknown> | null;
  isHomePage: boolean;
  websiteId: string;
  createdAt: Date;
  updatedAt: Date;
  components: ComponentData[];
}

export interface WebsiteWithPages {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  published: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  pages: PageWithComponents[];
}

export interface GeneratedComponent {
  type: ComponentType;
  name: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  order: number;
}

export interface GenerateResponse {
  success: boolean;
  message: string;
  data: {
    pageName: string;
    slug: string;
    components: GeneratedComponent[];
  } | null;
}
