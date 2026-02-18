import { z } from 'zod';

// ---------------------------------------------------------------------------
// Category Schemas
// ---------------------------------------------------------------------------

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be 100 characters or fewer')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ---------------------------------------------------------------------------
// Product Schemas
// ---------------------------------------------------------------------------

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or fewer'),
  description: z.string().max(5000, 'Description must be 5000 characters or fewer').optional(),
  price: z.number().positive('Price must be positive').optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ---------------------------------------------------------------------------
// Product Image Schema
// ---------------------------------------------------------------------------

export const createProductImageSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  alt: z.string().max(255).optional(),
  order: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------------------
// Contact Form Schema
// ---------------------------------------------------------------------------

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  message: z.string().min(1, 'Message is required').max(2000),
  productId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
