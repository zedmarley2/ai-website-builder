interface FooterProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Footer({ props, styles }: FooterProps) {
  const copyright =
    (props.copyright as string) ?? `\u00A9 ${new Date().getFullYear()} All rights reserved.`;
  const links = (props.links as Array<{ label: string; href: string }>) ?? [];

  return (
    <footer style={styles} className="bg-gray-900 px-8 py-8 text-center">
      <div className="flex flex-wrap justify-center gap-6">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500">{copyright}</p>
    </footer>
  );
}
