interface HeaderProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Header({ props, styles }: HeaderProps) {
  const logo = (props.logo as string) ?? 'My Website';
  const navItems = (props.navItems as Array<{ label: string; href: string }>) ?? [];

  return (
    <header
      style={styles}
      className="flex items-center justify-between bg-white px-6 py-4 shadow-sm"
    >
      <span className="text-lg font-bold text-gray-900">{logo}</span>
      <nav className="flex gap-6">
        {navItems.map((item, i) => (
          <a
            key={i}
            href={item.href}
            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
