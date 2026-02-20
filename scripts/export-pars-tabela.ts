/**
 * Export Pars Tabela as a standalone Next.js project and push to GitHub.
 *
 * Copies all source files, remaps public routes from /pars-tabela to /,
 * generates standalone config, and publishes to GitHub.
 */

import { mkdir, writeFile, readFile, cp, rm, chmod } from 'node:fs/promises';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const execFile = promisify(execFileCb);

const ROOT = path.resolve(__dirname, '..');
const GITHUB_OWNER = 'zedmarley2';
const REPO_NAME = 'pars-tabela';

async function run(cmd: string, args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFile(cmd, args, {
    cwd,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

async function writeProjectFile(outDir: string, filePath: string, content: string) {
  const fullPath = path.join(outDir, filePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

async function copySourceFile(srcRelative: string, outDir: string, destRelative?: string) {
  const src = path.join(ROOT, srcRelative);
  const dest = path.join(outDir, destRelative ?? srcRelative);
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true });
}

// ---------------------------------------------------------------------------
// Generate standalone config files
// ---------------------------------------------------------------------------

function packageJson(): string {
  return JSON.stringify(
    {
      name: 'pars-tabela',
      version: '2.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        seed: 'tsx scripts/seed.ts',
        'db:push': 'prisma db push',
        'db:generate': 'prisma generate',
        'db:studio': 'prisma studio',
      },
      dependencies: {
        next: '^16.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'framer-motion': '^12.0.0',
        '@prisma/client': '^7.0.0',
        '@prisma/adapter-pg': '^7.0.0',
        pg: '^8.0.0',
        'next-auth': '5.0.0-beta.30',
        '@auth/prisma-adapter': '^2.0.0',
        bcryptjs: '^3.0.0',
        zod: '^4.0.0',
        'lucide-react': '^0.500.0',
        recharts: '^2.15.0',
        'react-hot-toast': '^2.5.0',
      },
      devDependencies: {
        '@tailwindcss/postcss': '^4.0.0',
        '@types/bcryptjs': '^2.4.0',
        '@types/node': '^22.0.0',
        '@types/pg': '^8.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        prisma: '^7.0.0',
        tailwindcss: '^4.0.0',
        tsx: '^4.0.0',
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
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "scripts"]
}
`;

const NEXT_CONFIG = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

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

@variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
}

body {
  background: var(--background);
  color: var(--foreground);
}

#modal-root {
  position: relative;
  z-index: 9999;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

const GITIGNORE = `node_modules/
.next/
out/
.env
.env.local
*.tsbuildinfo
public/uploads/*
!public/uploads/.gitkeep
`;

const ENV_EXAMPLE = `# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pars_tabela

# NextAuth
NEXTAUTH_SECRET=change-me-in-production
NEXTAUTH_URL=http://localhost:3000

# Domain (optional)
ROOT_DOMAIN=localhost:3000

# Auto Update
GITHUB_REPO_URL=https://github.com/zedmarley2/pars-tabela
`;

const SETUP_SH = `#!/bin/bash
set -e

echo "=== Pars Tabela Setup ==="

# Copy .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists, skipping"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema
echo "Pushing database schema..."
npx prisma db push

# Seed data
echo "Seeding database..."
npm run seed

# Create backups directory
mkdir -p .backups

echo ""
echo "=== Setup complete! ==="
echo "Run: npm run dev"
`;

const PRISMA_CONFIG = `import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/pars_tabela",
  },
});
`;

const DOCKER_COMPOSE_DEV = `services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pars_tabela
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
`;

const DOCKERFILE = `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
`;

const ROOT_LAYOUT = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pars Tabela | Profesyonel Tabela & Reklam Cozumleri',
  description:
    'Profesyonel neon tabela, LED tabela ve elektronik tabela cozumleri. 15 yili askin deneyim ile isiginizla fark yaratin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: \`(function(){try{var t=localStorage.getItem('pars-tabela-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()\`,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-950">{children}</body>
    </html>
  );
}
`;

const MIDDLEWARE = `import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'authjs.session-token';
const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';

function hasSessionCookie(req: NextRequest): boolean {
  return !!(req.cookies.get(SESSION_COOKIE)?.value || req.cookies.get(SESSION_COOKIE_SECURE)?.value);
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith('/admin') && !nextUrl.pathname.startsWith('/admin/login')) {
    if (!hasSessionCookie(req)) {
      const loginUrl = new URL('/admin/login', nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\\\.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
`;

function generateReadme(): string {
  return `# Pars Tabela

Profesyonel neon tabela, LED tabela ve elektronik tabela cozumleri.
Premium admin panel ile teklif/siparis yonetimi, urun katalogu ve musteri iliskileri.

## Quick Start

\`\`\`bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Setup database
npx prisma db push
npx prisma generate

# Seed data (admin: admin@parstabela.com / admin123)
npm run seed

# Start development server
npm run dev
\`\`\`

## Pages

### Public Website
- **/** — Ana Sayfa (Hero, hizmetler, urunler, hakkimizda, iletisim)
- **/urunlerimiz** — Urun Galerisi (filtrelenebilir, kategorili)
- **/urunlerimiz/[id]** — Urun Detayi (resim galerisi, teklif isteme)

### Admin Panel
- **/admin** — Dashboard (gelir grafikleri, istatistikler, pipeline)
- **/admin/teklifler** — Teklifler & Siparisler (Kanban board + liste gorunumu)
- **/admin/teklifler/[id]** — Teklif Detayi (kalemler, durum gecmisi, notlar)
- **/admin/urunler** — Urun Yonetimi (CRUD, filtreleme, siralama)
- **/admin/kategoriler** — Kategori Yonetimi (siralama, ekleme/duzenleme)
- **/admin/siparisler** — Iletisim Talepleri (durum takibi)
- **/admin/musteriler** — Musteri Listesi (toplu gorunum)
- **/admin/medya** — Medya Kutuphanesi (yukleme, yonetim)
- **/admin/sayfalar/anasayfa** — Anasayfa Icerik Duzenleyici (hero, hizmetler, hakkimizda, iletisim)
- **/admin/ayarlar** — Site Ayarlari (genel, iletisim, sosyal, SEO, gorunum, site kimligi)
- **/admin/guncelleme** — Otomatik Guncelleme (GitHub'dan cek, yedekle, geri yukle)

## Features

### Quote/Order Pipeline
8-stage pipeline: Yeni Talep -> Teklif Hazirlandi -> Teklif Gonderildi -> Onaylandi -> Uretimde -> Teslime Hazir -> Teslim Edildi / Iptal

- Kanban board with drag-and-drop columns
- Auto-generated reference numbers (PT-YYYY-NNN)
- Line items with auto-calculated KDV (18%)
- Status timeline and internal notes
- Real revenue tracking from delivered quotes

### Admin Dashboard
- Real-time revenue charts (monthly, from delivered quotes)
- Pipeline summary with status counts
- Product and inquiry statistics
- Recent activity feed

### Homepage Content Management
- Edit hero section (title, subtitle, CTA)
- Add/edit/reorder service cards
- Edit about section text and stats
- Edit contact section and map URL
- All changes reflect on public site immediately

### Site Identity
- Custom logo upload (light/dark mode)
- Favicon, site name, tagline
- Dynamic header/footer branding

### Dark/Light Mode
- Toggle between dark and light themes
- Persisted in localStorage
- All components support both modes

### Auto Update System
- Pull updates from GitHub with real-time progress
- Automatic file and database backup before updates
- Rollback to any previous backup
- Full update history with step-by-step details
- Password confirmation for security

### Performance
- Optimized font loading (next/font)
- prefers-reduced-motion accessibility support
- SEO meta tags and OpenGraph
- Route-level loading states

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion
- PostgreSQL + Prisma v7 ORM
- NextAuth.js v5 (Auth.js)
- Recharts, Lucide React, React Hot Toast

## Admin Login

Email: \`admin@parstabela.com\`
Password: \`admin123\`

## Docker

\`\`\`bash
docker compose up --build
\`\`\`

---

Built with [AI Website Builder](https://github.com/zedmarley2/ai-website-builder)
`;
}

/**
 * Read the actual Prisma schema and strip out platform-specific models
 * (Website, Page, Component, Domain, DomainStatus) that belong to
 * the generic website builder, not the standalone Pars Tabela project.
 */
async function generatePrismaSchema(): Promise<string> {
  const fullSchema = await readFile(path.join(ROOT, 'prisma/schema.prisma'), 'utf-8');

  // Remove platform-specific sections
  let schema = fullSchema;

  // Remove Website model and its relations
  schema = schema.replace(/\/\/ -{10,}\n\/\/ Application Models\n\/\/ -{10,}\n[\s\S]*?(?=\/\/ -{10,}\n\/\/ Pars Tabela)/, '');

  // Remove `websites Website[]` from User model
  schema = schema.replace(/\n\s*websites\s+Website\[\]\n/, '\n');

  // Remove quotes Quote[] @relation("QuoteProduct") won't hurt since we keep the Quote model
  // But we need to keep the relation. Actually the Product model references Quote with @relation("QuoteProduct")
  // and the Quote model references Product with @relation("QuoteProduct"), so both are kept.

  return schema;
}

// ---------------------------------------------------------------------------
// Main export logic
// ---------------------------------------------------------------------------

async function main() {
  const outDir = path.join(os.tmpdir(), `export-pars-tabela-${crypto.randomUUID()}`);
  console.log('Export directory:', outDir);

  try {
    await mkdir(outDir, { recursive: true });
    await mkdir(path.join(outDir, 'public/uploads'), { recursive: true });

    // 1. Write config files
    console.log('Writing config files...');
    const prismaSchema = await generatePrismaSchema();

    await Promise.all([
      writeProjectFile(outDir, 'package.json', packageJson()),
      writeProjectFile(outDir, 'tsconfig.json', TSCONFIG),
      writeProjectFile(outDir, 'next.config.ts', NEXT_CONFIG),
      writeProjectFile(outDir, 'postcss.config.mjs', POSTCSS_CONFIG),
      writeProjectFile(outDir, '.gitignore', GITIGNORE),
      writeProjectFile(outDir, '.env.example', ENV_EXAMPLE),
      writeProjectFile(outDir, '.env', ENV_EXAMPLE),
      writeProjectFile(outDir, 'prisma/schema.prisma', prismaSchema),
      writeProjectFile(outDir, 'prisma.config.ts', PRISMA_CONFIG),
      writeProjectFile(outDir, 'docker-compose.dev.yml', DOCKER_COMPOSE_DEV),
      writeProjectFile(outDir, 'Dockerfile', DOCKERFILE),
      writeProjectFile(outDir, 'README.md', generateReadme()),
      writeProjectFile(outDir, 'public/uploads/.gitkeep', ''),
      writeProjectFile(outDir, 'src/app/globals.css', GLOBALS_CSS),
      writeProjectFile(outDir, 'src/app/layout.tsx', ROOT_LAYOUT),
      writeProjectFile(outDir, 'src/middleware.ts', MIDDLEWARE),
      writeProjectFile(outDir, 'setup.sh', SETUP_SH),
    ]);

    // Make setup.sh executable
    await chmod(path.join(outDir, 'setup.sh'), 0o755);

    // 2. Copy source files
    console.log('Copying source files...');

    const directCopies: Array<[string, string]> = [
      // Lib
      ['src/lib/prisma.ts', 'src/lib/prisma.ts'],
      ['src/lib/auth.ts', 'src/lib/auth.ts'],
      ['src/lib/admin-auth.ts', 'src/lib/admin-auth.ts'],
      ['src/lib/settings.ts', 'src/lib/settings.ts'],
      ['src/lib/update-utils.ts', 'src/lib/update-utils.ts'],
      // Types
      ['src/types/admin.ts', 'src/types/admin.ts'],
      // Seed script
      ['scripts/seed-pars-tabela.ts', 'scripts/seed.ts'],
    ];

    const dirCopies: Array<[string, string]> = [
      // Public website components
      ['src/components/pars-tabela', 'src/components/pars-tabela'],
      // Admin components
      ['src/components/admin', 'src/components/admin'],
      // API routes - admin
      ['src/app/api/admin', 'src/app/api/admin'],
      // API routes - pars-tabela public
      ['src/app/api/pars-tabela', 'src/app/api/pars-tabela'],
      // NextAuth API route
      ['src/app/api/auth', 'src/app/api/auth'],
    ];

    await Promise.all([
      ...directCopies.map(([src, dest]) => copySourceFile(src, outDir, dest)),
      ...dirCopies.map(([src, dest]) => copySourceFile(src, outDir, dest)),
    ]);

    // 3. Copy and remap page routes
    console.log('Generating page routes...');

    // Read public site pages
    const parsTabelaPage = await readFile(path.join(ROOT, 'src/app/pars-tabela/page.tsx'), 'utf-8');
    const parsTabelaLayout = await readFile(path.join(ROOT, 'src/app/pars-tabela/layout.tsx'), 'utf-8');
    const urunlerimizPage = await readFile(
      path.join(ROOT, 'src/app/pars-tabela/urunlerimiz/page.tsx'),
      'utf-8'
    );

    // Keep the layout as-is (has generateMetadata with SEO + OpenGraph)
    const standaloneLayout = parsTabelaLayout;

    const fixedPage = parsTabelaPage;
    const fixedUrunlerimizPage = urunlerimizPage;

    // Copy loading.tsx
    const loadingPage = await readFile(path.join(ROOT, 'src/app/pars-tabela/loading.tsx'), 'utf-8');

    await Promise.all([
      // Main public pages at root
      writeProjectFile(outDir, 'src/app/(public)/page.tsx', fixedPage),
      writeProjectFile(outDir, 'src/app/(public)/layout.tsx', standaloneLayout),
      writeProjectFile(outDir, 'src/app/(public)/loading.tsx', loadingPage),
      writeProjectFile(outDir, 'src/app/(public)/urunlerimiz/page.tsx', fixedUrunlerimizPage),
      // Product detail page
      copySourceFile(
        'src/app/pars-tabela/urunlerimiz/[id]',
        outDir,
        'src/app/(public)/urunlerimiz/[id]'
      ),
      // Admin pages
      copySourceFile('src/app/(admin)', outDir, 'src/app/(admin)'),
      copySourceFile('src/app/(admin-auth)', outDir, 'src/app/(admin-auth)'),
    ]);

    // 3b. Add force-dynamic to layouts to prevent build-time DB queries
    const dynamicExport = "export const dynamic = 'force-dynamic';\n\n";
    const layoutsToFix = [
      'src/app/(public)/layout.tsx',
      'src/app/(admin)/admin/layout.tsx',
    ];
    await Promise.all(
      layoutsToFix.map(async (relPath) => {
        const filePath = path.join(outDir, relPath);
        const content = await readFile(filePath, 'utf-8');
        await writeFile(filePath, dynamicExport + content, 'utf-8');
      })
    );

    // 4. Fix route references (pars-tabela → root)
    // Smart regex: only replace /pars-tabela in URL path strings (after quotes),
    // NOT in import paths like @/components/pars-tabela/ or API paths like /api/pars-tabela/
    console.log('Fixing route references...');

    function fixRouteRefs(content: string): string {
      return content
        // Step 1: '/pars-tabela/...' or `/pars-tabela/...` → remove prefix (keep following /)
        .replace(/(['"`])\/pars-tabela\//g, '$1/')
        // Step 2: '/pars-tabela' at end of path, or '/pars-tabela#...' → replace with /
        .replace(/(['"`])\/pars-tabela(?=['"`#])/g, '$1/');
    }

    const componentFixFiles = [
      'src/components/pars-tabela/neon-header.tsx',
      'src/components/pars-tabela/neon-footer.tsx',
      'src/components/pars-tabela/product-detail.tsx',
      'src/components/pars-tabela/products-gallery.tsx',
      'src/components/admin/sidebar.tsx',
    ];

    await Promise.all(
      componentFixFiles.map(async (relPath) => {
        const filePath = path.join(outDir, relPath);
        const content = await readFile(filePath, 'utf-8');
        const fixed = fixRouteRefs(content);
        if (fixed !== content) {
          await writeFile(filePath, fixed, 'utf-8');
        }
      })
    );

    // 5. Publish to GitHub
    console.log('Publishing to GitHub...');

    try {
      await run('gh', ['auth', 'status'], outDir);
    } catch {
      throw new Error('GitHub CLI (gh) is not authenticated. Run `gh auth login` first.');
    }

    await run('git', ['init'], outDir);
    await run('git', ['add', '-A'], outDir);
    await run(
      'git',
      [
        'commit',
        '-m',
        'feat: Pars Tabela v2.0 — full admin panel, quote pipeline, dark mode',
      ],
      outDir
    );

    const repoName = REPO_NAME;
    const description =
      'Pars Tabela — Profesyonel tabela & reklam cozumleri. Admin panel, teklif/siparis pipeline, urun katalogu.';
    const repoFullName = `${GITHUB_OWNER}/${repoName}`;

    // Check if repo already exists
    let repoExists = false;
    try {
      await run('gh', ['repo', 'view', repoFullName, '--json', 'name'], outDir);
      repoExists = true;
    } catch {
      // Repo doesn't exist
    }

    if (repoExists) {
      // Force push to existing repo — detect default branch name
      const repoInfo = await run('gh', ['repo', 'view', repoFullName, '--json', 'defaultBranchRef', '-q', '.defaultBranchRef.name'], outDir);
      const defaultBranch = repoInfo.trim() || 'main';
      console.log(`Repo ${repoFullName} exists (branch: ${defaultBranch}), force pushing...`);
      await run('git', ['remote', 'add', 'origin', `https://github.com/${repoFullName}.git`], outDir);
      await run('git', ['branch', '-M', defaultBranch], outDir);
      await run('git', ['push', '--force', 'origin', defaultBranch], outDir);
    } else {
      // Create new repo
      console.log(`Creating repo ${repoFullName}...`);
      await run(
        'gh',
        [
          'repo',
          'create',
          repoFullName,
          '--public',
          '--description',
          description,
          '--source',
          '.',
          '--push',
        ],
        outDir
      );
    }

    const repoUrl = `https://github.com/${GITHUB_OWNER}/${repoName}`;
    console.log('\n========================================');
    console.log('Export successful!');
    console.log(`Repo URL:  ${repoUrl}`);
    console.log(`Repo Name: ${repoName}`);
    console.log('========================================\n');
  } finally {
    await rm(outDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
