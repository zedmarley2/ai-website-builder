interface PricingProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Pricing({ props, styles }: PricingProps) {
  const heading = (props.heading as string) ?? 'Pricing';
  const tiers =
    (props.tiers as Array<{
      name: string;
      price: string;
      features: string[];
      ctaText?: string;
    }>) ?? [];

  return (
    <section style={styles} className="bg-gray-50 px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">{tier.price}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 text-green-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-8 block rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {tier.ctaText ?? 'Get Started'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
