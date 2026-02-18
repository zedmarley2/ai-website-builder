interface FeaturesProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Features({ props, styles }: FeaturesProps) {
  const heading = (props.heading as string) ?? 'Features';
  const features =
    (props.features as Array<{ title: string; description: string; icon?: string }>) ?? [];

  return (
    <section style={styles} className="bg-gray-50 px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
              {feature.icon && (
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <span className="text-lg">{feature.icon}</span>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
