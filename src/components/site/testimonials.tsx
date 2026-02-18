interface TestimonialsProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Testimonials({ props, styles }: TestimonialsProps) {
  const heading = (props.heading as string) ?? 'Testimonials';
  const testimonials = (props.testimonials as Array<{ quote: string; author: string }>) ?? [];

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl bg-gray-50 p-6">
              <p className="italic text-gray-600">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-gray-900">{t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
