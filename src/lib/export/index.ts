import { mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { generateProject, type ProjectGeneratorOptions } from './project-generator';
import { generateSetupScript } from './setup-script-generator';
import { generateDockerfile, generateDockerCompose } from './docker-generator';
import { publishToGitHub } from './github-publisher';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportOptions {
  websiteId: string;
  userId: string;
}

export interface ExportResult {
  repoUrl: string;
  repoName: string;
}

// ---------------------------------------------------------------------------
// README generator (co-located since it's small)
// ---------------------------------------------------------------------------

function generateReadme(website: {
  name: string;
  description: string | null;
  pages: Array<{ name: string; slug: string; isHomePage: boolean }>;
}): string {
  const pageList = website.pages
    .map((p) => `- **${p.name}** — \`${p.isHomePage ? '/' : `/${p.slug}`}\``)
    .join('\n');

  return `# ${website.name}

${website.description ?? 'A website generated with AI Website Builder.'}

## Quick Start

### Option 1: Docker (recommended)

\`\`\`bash
docker compose up --build
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

### Option 2: Setup Script (VPS)

\`\`\`bash
chmod +x setup.sh
sudo ./setup.sh
\`\`\`

### Option 3: Manual

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## Pages

${pageList}

## Tech Stack

- [Next.js](https://nextjs.org) 15 with App Router
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [TypeScript](https://www.typescriptlang.org)

## Deploy to VPS

1. Clone this repo on your server
2. Run \`sudo ./setup.sh\` — it installs Node.js, Docker, PostgreSQL, builds the app, and starts it with PM2
3. Your site will be available on port 3000
4. Point your domain's A record to your server IP and set up a reverse proxy (nginx/caddy)

## Docker Deploy

\`\`\`bash
# Build and run
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
\`\`\`

---

Built with [AI Website Builder](https://github.com/zedmarley2/ai-website-builder)
`;
}

// ---------------------------------------------------------------------------
// Main Export Function
// ---------------------------------------------------------------------------

export async function exportWebsite(options: ExportOptions): Promise<ExportResult> {
  const { websiteId, userId } = options;

  // 1. Fetch full website data
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: {
      pages: {
        orderBy: { order: 'asc' },
        include: {
          components: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!website) {
    throw new Error('Website not found');
  }

  if (website.userId !== userId) {
    throw new Error('Forbidden');
  }

  if (website.pages.length === 0) {
    throw new Error('Website has no pages to export');
  }

  // 2. Create temp directory
  const outputDir = path.join(os.tmpdir(), `export-${crypto.randomUUID()}`);

  try {
    await mkdir(outputDir, { recursive: true });

    const projectName = website.subdomain;

    // 3. Generate all files
    await generateProject({
      website: website as unknown as ProjectGeneratorOptions['website'],
      outputDir,
    });

    await Promise.all([
      writeFile(path.join(outputDir, 'setup.sh'), generateSetupScript({ projectName }), {
        mode: 0o755,
      }),
      writeFile(path.join(outputDir, 'Dockerfile'), generateDockerfile({ projectName })),
      writeFile(path.join(outputDir, 'docker-compose.yml'), generateDockerCompose({ projectName })),
      writeFile(
        path.join(outputDir, 'README.md'),
        generateReadme({
          name: website.name,
          description: website.description,
          pages: website.pages.map((p) => ({
            name: p.name,
            slug: p.slug,
            isHomePage: p.isHomePage,
          })),
        })
      ),
    ]);

    // 4. Publish to GitHub
    const result = await publishToGitHub({
      projectDir: outputDir,
      repoName: projectName,
      description: website.description ?? `${website.name} — built with AI Website Builder`,
      githubOwner: 'zedmarley2',
    });

    return {
      repoUrl: result.repoUrl,
      repoName: projectName,
    };
  } finally {
    // 5. Clean up temp directory
    await rm(outputDir, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup errors
    });
  }
}
