interface SectionProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Section({ props, styles }: SectionProps) {
  const heading = (props.heading as string) ?? '';
  const content = (props.content as string) ?? '';

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-4xl">
        {heading && <h2 className="mb-6 text-3xl font-bold text-gray-900">{heading}</h2>}
        {content && <p className="text-lg leading-relaxed text-gray-600">{content}</p>}
      </div>
    </section>
  );
}
