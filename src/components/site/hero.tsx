interface HeroProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Hero({ props, styles }: HeroProps) {
  const title = (props.title as string) ?? 'Welcome to Your Website';
  const subtitle = (props.subtitle as string) ?? '';
  const ctaText = (props.ctaText as string) ?? 'Get Started';
  const ctaLink = (props.ctaLink as string) ?? '#';

  return (
    <section
      style={styles}
      className="bg-gradient-to-br from-blue-600 to-purple-700 px-8 py-20 text-center text-white"
    >
      <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">{title}</h1>
      {subtitle && <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">{subtitle}</p>}
      <div className="mt-8">
        <a
          href={ctaLink}
          className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}
