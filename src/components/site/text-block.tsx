interface TextBlockProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function TextBlock({ props, styles }: TextBlockProps) {
  const content =
    (props.content as string) ?? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  return (
    <section style={styles} className="px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <p className="leading-relaxed text-gray-600">{content}</p>
      </div>
    </section>
  );
}
