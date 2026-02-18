interface CTAProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function CTA({ props, styles }: CTAProps) {
  const heading = (props.heading as string) ?? 'Ready to get started?';
  const description = (props.description as string) ?? '';
  const buttonText = (props.buttonText as string) ?? 'Sign Up Now';
  const buttonLink = (props.buttonLink as string) ?? '#';

  return (
    <section style={styles} className="bg-blue-600 px-8 py-16 text-center text-white">
      <h2 className="text-3xl font-bold">{heading}</h2>
      {description && <p className="mx-auto mt-4 max-w-xl text-blue-100">{description}</p>}
      <div className="mt-8">
        <a
          href={buttonLink}
          className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          {buttonText}
        </a>
      </div>
    </section>
  );
}
