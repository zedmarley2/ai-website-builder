/**
 * Export Pars Tabela as a standalone Next.js project and push to GitHub.
 *
 * This custom exporter copies actual source files rather than using
 * the generic component renderer, because Pars Tabela has:
 * - Custom neon-themed components
 * - Admin panel with product/category CRUD
 * - API routes for products, categories, upload, stats, contact
 * - Prisma models (Category, Product, ProductImage)
 */

import { mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
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
      version: '1.0.0',
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
public/uploads/*
!public/uploads/.gitkeep
`;

const ENV_EXAMPLE = `# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pars_tabela

# NextAuth
NEXTAUTH_SECRET=change-me-in-production
NEXTAUTH_URL=http://localhost:3000

# Domain (optional, for subdomain routing)
ROOT_DOMAIN=localhost:3000
`;

const PRISMA_SCHEMA = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String?
  image     String?
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  accounts Account[]
  sessions Session[]

  @@index([email])
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products Product[]

  @@index([slug])
}

model Product {
  id          String    @id @default(uuid())
  name        String
  description String?   @db.Text
  price       Decimal?  @db.Decimal(10, 2)
  categoryId  String
  featured    Boolean   @default(false)
  published   Boolean   @default(true)
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  category Category       @relation(fields: [categoryId], references: [id])
  images   ProductImage[]

  @@index([categoryId])
  @@index([published])
  @@index([featured])
}

model ProductImage {
  id        String   @id @default(uuid())
  url       String
  alt       String?
  order     Int      @default(0)
  productId String
  createdAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}
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

function generateReadme(): string {
  return `# Pars Tabela

Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri.

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

- **/** — Ana Sayfa (Neon hero, services, products, about, contact)
- **/urunlerimiz** — Tüm Ürünler (filterable product gallery)
- **/admin** — Admin Panel (login, dashboard, product/category management)

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion
- PostgreSQL + Prisma ORM
- NextAuth.js v5

## Admin Panel

Login at \`/admin/login\` with:
- Email: \`admin@parstabela.com\`
- Password: \`admin123\`

Features: Dashboard stats, product CRUD, category management, image upload.

## Docker

\`\`\`bash
docker compose up --build
\`\`\`

---

Built with [AI Website Builder](https://github.com/zedmarley2/ai-website-builder)
`;
}

// Standalone layout (no platform wrapper, no Providers)
const ROOT_LAYOUT = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pars Tabela | Neon & Elektronik Tabela',
  description:
    'Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri. 15 yılı aşkın deneyim ile ışığınızla fark yaratın.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
`;

// Middleware for admin auth protection
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
    await Promise.all([
      writeProjectFile(outDir, 'package.json', packageJson()),
      writeProjectFile(outDir, 'tsconfig.json', TSCONFIG),
      writeProjectFile(outDir, 'next.config.ts', NEXT_CONFIG),
      writeProjectFile(outDir, 'postcss.config.mjs', POSTCSS_CONFIG),
      writeProjectFile(outDir, '.gitignore', GITIGNORE),
      writeProjectFile(outDir, '.env.example', ENV_EXAMPLE),
      writeProjectFile(outDir, 'prisma/schema.prisma', PRISMA_SCHEMA),
      writeProjectFile(outDir, 'prisma.config.ts', PRISMA_CONFIG),
      writeProjectFile(outDir, 'docker-compose.dev.yml', DOCKER_COMPOSE_DEV),
      writeProjectFile(outDir, 'Dockerfile', DOCKERFILE),
      writeProjectFile(outDir, 'README.md', generateReadme()),
      writeProjectFile(outDir, 'public/uploads/.gitkeep', ''),
      writeProjectFile(outDir, 'src/app/globals.css', GLOBALS_CSS),
      writeProjectFile(outDir, 'src/app/layout.tsx', ROOT_LAYOUT),
      writeProjectFile(outDir, 'src/middleware.ts', MIDDLEWARE),
    ]);

    // 2. Copy source files from the project
    console.log('Copying source files...');

    // Files to copy directly (maintaining path structure under src/)
    const directCopies: Array<[string, string]> = [
      // Lib
      ['src/lib/prisma.ts', 'src/lib/prisma.ts'],
      ['src/lib/auth.ts', 'src/lib/auth.ts'],
      ['src/lib/admin-auth.ts', 'src/lib/admin-auth.ts'],
      // Types
      ['src/types/admin.ts', 'src/types/admin.ts'],
      // Seed script
      ['scripts/seed-pars-tabela.ts', 'scripts/seed.ts'],
    ];

    // Directories to copy entirely
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

    // 3. Copy page files - need to remap routes for standalone site
    console.log('Generating page routes...');

    // The public site pages: pars-tabela/ → app root (/) in standalone
    // Read source pages and remap
    const parsTabelaPage = await readFile(path.join(ROOT, 'src/app/pars-tabela/page.tsx'), 'utf-8');
    const parsTabelaLayout = await readFile(path.join(ROOT, 'src/app/pars-tabela/layout.tsx'), 'utf-8');
    const urunlerimizPage = await readFile(
      path.join(ROOT, 'src/app/pars-tabela/urunlerimiz/page.tsx'),
      'utf-8'
    );

    // Remove the layout metadata (it's in root layout now) and simplify
    const standaloneLayout = parsTabelaLayout.replace(
      /export const metadata[\s\S]*?};/,
      ''
    );

    await Promise.all([
      // Main public pages at root
      writeProjectFile(outDir, 'src/app/(public)/page.tsx', parsTabelaPage),
      writeProjectFile(outDir, 'src/app/(public)/layout.tsx', standaloneLayout),
      writeProjectFile(outDir, 'src/app/(public)/urunlerimiz/page.tsx', urunlerimizPage),

      // Admin pages - copy route groups
      copySourceFile('src/app/(admin)', outDir, 'src/app/(admin)'),
      copySourceFile('src/app/(admin-auth)', outDir, 'src/app/(admin-auth)'),
    ]);

    // 4. Create the auth registration route
    console.log('Copying auth registration route...');
    await copySourceFile('src/app/api/auth/register', outDir, 'src/app/api/auth/register');

    // 5. Fix seed script import path for standalone (no import from ../src/lib)
    const seedContent = await readFile(path.join(outDir, 'scripts/seed.ts'), 'utf-8');
    // The seed script creates its own PrismaClient, so it should work as-is.

    // 6. Publish to GitHub
    console.log('Publishing to GitHub...');

    // Check gh auth
    try {
      await run('gh', ['auth', 'status'], outDir);
    } catch {
      throw new Error('GitHub CLI (gh) is not authenticated. Run `gh auth login` first.');
    }

    // Init git repo
    await run('git', ['init'], outDir);
    await run('git', ['add', '-A'], outDir);
    await run(
      'git',
      ['commit', '-m', 'Initial commit: Pars Tabela — exported from AI Website Builder'],
      outDir
    );

    // Create GitHub repo (handle name collision)
    let repoName = REPO_NAME;
    const description = 'Pars Tabela — Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri';

    try {
      await run(
        'gh',
        [
          'repo',
          'create',
          `${GITHUB_OWNER}/${repoName}`,
          '--public',
          '--description',
          description,
          '--source',
          '.',
          '--push',
        ],
        outDir
      );
    } catch {
      // Repo name likely taken — append suffix
      const suffix = crypto.randomBytes(2).toString('hex');
      repoName = `${REPO_NAME}-${suffix}`;
      console.log(`Repo name taken, trying: ${repoName}`);

      await run(
        'gh',
        [
          'repo',
          'create',
          `${GITHUB_OWNER}/${repoName}`,
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
    // Cleanup
    await rm(outDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
