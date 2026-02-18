import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComponentData {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown> | null;
  styles: Record<string, unknown> | null;
  order: number;
}

interface PageData {
  id: string;
  name: string;
  slug: string;
  order: number;
  isHomePage: boolean;
  components: ComponentData[];
}

interface WebsiteData {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  pages: PageData[];
}

export interface ProjectGeneratorOptions {
  website: WebsiteData;
  outputDir: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeProjectFile(outputDir: string, filePath: string, content: string) {
  const fullPath = path.join(outputDir, filePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function generateProject(options: ProjectGeneratorOptions): Promise<void> {
  const { website, outputDir } = options;
  const projectName = website.subdomain;

  await mkdir(outputDir, { recursive: true });
  await mkdir(path.join(outputDir, 'public'), { recursive: true });

  // All files written in parallel for speed
  await Promise.all([
    writeProjectFile(outputDir, 'package.json', generatePackageJson(projectName)),
    writeProjectFile(outputDir, 'tsconfig.json', TSCONFIG),
    writeProjectFile(outputDir, 'next.config.ts', NEXT_CONFIG),
    writeProjectFile(outputDir, 'postcss.config.mjs', POSTCSS_CONFIG),
    writeProjectFile(outputDir, '.gitignore', GITIGNORE),
    writeProjectFile(outputDir, '.env.example', ENV_EXAMPLE),
    writeProjectFile(outputDir, 'src/app/globals.css', GLOBALS_CSS),
    writeProjectFile(
      outputDir,
      'src/app/layout.tsx',
      generateLayout(website.name, website.description)
    ),
    writeProjectFile(
      outputDir,
      'src/data/website.json',
      JSON.stringify(sanitizeWebsiteData(website), null, 2)
    ),
    writeProjectFile(outputDir, 'src/components/component-renderer.tsx', COMPONENT_RENDERER),
    writeProjectFile(outputDir, 'src/components/header.tsx', COMP_HEADER),
    writeProjectFile(outputDir, 'src/components/hero.tsx', COMP_HERO),
    writeProjectFile(outputDir, 'src/components/footer.tsx', COMP_FOOTER),
    writeProjectFile(outputDir, 'src/components/section.tsx', COMP_SECTION),
    writeProjectFile(outputDir, 'src/components/cta.tsx', COMP_CTA),
    writeProjectFile(outputDir, 'src/components/features.tsx', COMP_FEATURES),
    writeProjectFile(outputDir, 'src/components/testimonials.tsx', COMP_TESTIMONIALS),
    writeProjectFile(outputDir, 'src/components/pricing.tsx', COMP_PRICING),
    writeProjectFile(outputDir, 'src/components/contact.tsx', COMP_CONTACT),
    writeProjectFile(outputDir, 'src/components/gallery.tsx', COMP_GALLERY),
    writeProjectFile(outputDir, 'src/components/text-block.tsx', COMP_TEXT),
    writeProjectFile(outputDir, 'src/components/image-block.tsx', COMP_IMAGE),
    writeProjectFile(outputDir, 'src/app/page.tsx', HOME_PAGE),
    writeProjectFile(outputDir, 'src/app/[slug]/page.tsx', DYNAMIC_PAGE),
  ]);
}

// ---------------------------------------------------------------------------
// Sanitize data for JSON embedding
// ---------------------------------------------------------------------------

function sanitizeWebsiteData(website: WebsiteData) {
  return {
    name: website.name,
    description: website.description,
    subdomain: website.subdomain,
    pages: website.pages
      .sort((a, b) => a.order - b.order)
      .map((page) => ({
        name: page.name,
        slug: page.slug,
        isHomePage: page.isHomePage,
        components: page.components
          .sort((a, b) => a.order - b.order)
          .map((comp) => ({
            id: comp.id,
            type: comp.type,
            name: comp.name,
            props: comp.props ?? {},
            styles: comp.styles ?? {},
          })),
      })),
  };
}

// ---------------------------------------------------------------------------
// Static file templates
// ---------------------------------------------------------------------------

function generatePackageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        '@tailwindcss/postcss': '^4.0.0',
        '@types/node': '^22.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        tailwindcss: '^4.0.0',
        typescript: '^5.0.0',
      },
    },
    null,
    2
  );
}

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`;

const NEXT_CONFIG = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
`;

const POSTCSS_CONFIG = `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;

const GLOBALS_CSS = `@import "tailwindcss";
`;

const GITIGNORE = `node_modules/
.next/
out/
.env
.env.local
*.tsbuildinfo
`;

const ENV_EXAMPLE = `PORT=3000
`;

function generateLayout(name: string, description: string | null): string {
  const safeDesc = description
    ? description.replace(/'/g, "\\'")
    : `Website built with AI Website Builder`;
  const safeName = name.replace(/'/g, "\\'");
  return `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${safeName}',
  description: '${safeDesc}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
`;
}

// ---------------------------------------------------------------------------
// Component Renderer
// ---------------------------------------------------------------------------

const COMPONENT_RENDERER = `import { Header } from './header';
import { Hero } from './hero';
import { Footer } from './footer';
import { Section } from './section';
import { CTA } from './cta';
import { Features } from './features';
import { Testimonials } from './testimonials';
import { Pricing } from './pricing';
import { Contact } from './contact';
import { Gallery } from './gallery';
import { TextBlock } from './text-block';
import { ImageBlock } from './image-block';

interface ComponentProps {
  component: {
    id: string;
    type: string;
    name: string;
    props: Record<string, unknown>;
    styles: Record<string, unknown>;
  };
}

const componentMap: Record<
  string,
  React.ComponentType<{ props: Record<string, unknown>; styles: Record<string, unknown> }>
> = {
  HEADER: Header,
  HERO: Hero,
  FOOTER: Footer,
  SECTION: Section,
  CTA: CTA,
  FEATURES: Features,
  TESTIMONIALS: Testimonials,
  PRICING: Pricing,
  CONTACT: Contact,
  GALLERY: Gallery,
  TEXT: TextBlock,
  IMAGE: ImageBlock,
  // Also support capitalized names from the editor
  Header: Header,
  Hero: Hero,
  Footer: Footer,
  Section: Section,
  Features: Features,
  Testimonials: Testimonials,
  Pricing: Pricing,
  Contact: Contact,
  Gallery: Gallery,
  Text: TextBlock,
  Image: ImageBlock,
};

export function ComponentRenderer({ component }: ComponentProps) {
  const Component = componentMap[component.type];

  if (!Component) {
    return (
      <div className="bg-gray-50 px-8 py-6 text-center">
        <span className="text-sm text-gray-500">{component.type} component</span>
      </div>
    );
  }

  return <Component props={component.props} styles={component.styles} />;
}
`;

// ---------------------------------------------------------------------------
// Page Templates
// ---------------------------------------------------------------------------

const HOME_PAGE = `import websiteData from '@/data/website.json';
import { ComponentRenderer } from '@/components/component-renderer';

export default function HomePage() {
  const homePage =
    websiteData.pages.find((p) => p.isHomePage) ?? websiteData.pages[0];

  if (!homePage) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">No content yet.</p>
      </main>
    );
  }

  return (
    <main>
      {homePage.components.map((component) => (
        <ComponentRenderer key={component.id} component={component} />
      ))}
    </main>
  );
}
`;

const DYNAMIC_PAGE = `import websiteData from '@/data/website.json';
import { ComponentRenderer } from '@/components/component-renderer';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return websiteData.pages
    .filter((p) => !p.isHomePage)
    .map((p) => ({ slug: p.slug }));
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = websiteData.pages.find((p) => p.slug === slug);

  if (!page) return notFound();

  return (
    <main>
      {page.components.map((component) => (
        <ComponentRenderer key={component.id} component={component} />
      ))}
    </main>
  );
}
`;

// ---------------------------------------------------------------------------
// Component Templates
// ---------------------------------------------------------------------------

const COMP_HEADER = `interface HeaderProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Header({ props, styles }: HeaderProps) {
  const logo = (props.logo as string) ?? 'My Website';
  const navItems = (props.navItems as Array<{ label: string; href: string }>) ?? [];

  return (
    <header style={styles} className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
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
`;

const COMP_HERO = `interface HeroProps {
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
`;

const COMP_FOOTER = `interface FooterProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Footer({ props, styles }: FooterProps) {
  const copyright =
    (props.copyright as string) ?? \`© \${new Date().getFullYear()} All rights reserved.\`;
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
`;

const COMP_SECTION = `interface SectionProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Section({ props, styles }: SectionProps) {
  const heading = (props.heading as string) ?? '';
  const content = (props.content as string) ?? '';

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-4xl">
        {heading && (
          <h2 className="mb-6 text-3xl font-bold text-gray-900">{heading}</h2>
        )}
        {content && <p className="text-lg text-gray-600 leading-relaxed">{content}</p>}
      </div>
    </section>
  );
}
`;

const COMP_CTA = `interface CTAProps {
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
`;

const COMP_FEATURES = `interface FeaturesProps {
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
`;

const COMP_TESTIMONIALS = `interface TestimonialsProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Testimonials({ props, styles }: TestimonialsProps) {
  const heading = (props.heading as string) ?? 'Testimonials';
  const testimonials =
    (props.testimonials as Array<{ quote: string; author: string }>) ?? [];

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl bg-gray-50 p-6">
              <p className="text-gray-600 italic">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-gray-900">{t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const COMP_PRICING = `interface PricingProps {
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
`;

const COMP_CONTACT = `interface ContactProps {
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
        {description && (
          <p className="mb-8 text-center text-gray-600">{description}</p>
        )}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
`;

const COMP_GALLERY = `interface GalleryProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Gallery({ props, styles }: GalleryProps) {
  const images = (props.images as Array<{ src: string; alt?: string }>) ?? [];

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.length > 0
            ? images.map((img, i) => (
                <div key={i} className="overflow-hidden rounded-lg">
                  <img
                    src={img.src}
                    alt={img.alt ?? ''}
                    className="h-64 w-full object-cover"
                  />
                </div>
              ))
            : [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                >
                  <span className="text-sm text-gray-400">Image {i}</span>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
`;

const COMP_TEXT = `interface TextBlockProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function TextBlock({ props, styles }: TextBlockProps) {
  const content =
    (props.content as string) ??
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  return (
    <section style={styles} className="px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-gray-600 leading-relaxed">{content}</p>
      </div>
    </section>
  );
}
`;

const COMP_IMAGE = `interface ImageBlockProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function ImageBlock({ props, styles }: ImageBlockProps) {
  const src = props.src as string | undefined;
  const alt = (props.alt as string) ?? '';
  const caption = props.caption as string | undefined;

  return (
    <figure style={styles} className="px-8 py-8">
      <div className="mx-auto max-w-4xl">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <span className="text-sm text-gray-400">Image placeholder</span>
          </div>
        )}
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-gray-500">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
`;
