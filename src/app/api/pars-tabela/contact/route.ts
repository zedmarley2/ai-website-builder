import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/types/admin';

/**
 * POST /api/pars-tabela/contact
 * Public contact form submission.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = contactFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, email, phone, message } = validation.data;

    // Log to console for now; email sending can be added later
    console.warn('[Contact Form]', { name, email, phone, message, timestamp: new Date().toISOString() });

    return NextResponse.json({
      data: { message: 'Your message has been received. We will get back to you soon.' },
    });
  } catch (err) {
    console.error('Error processing contact form:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
