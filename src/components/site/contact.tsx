interface ContactProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Contact({ props, styles }: ContactProps) {
  const heading = (props.heading as string) ?? 'Contact Us';
  const description = (props.description as string) ?? '';

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-xl">
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        {description && <p className="mb-8 text-center text-gray-600">{description}</p>}
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="How can we help?"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
