# AI Website Builder

An AI-powered website builder that lets users create, customize, and deploy websites through natural language prompts and an intuitive visual editor.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + Framer Motion |
| Backend | Next.js API Routes |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth.js v5 (Auth.js) |
| AI | Claude API (Anthropic) |
| Testing | Vitest + Playwright |
| Deployment | Docker + Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-website-builder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (especially ANTHROPIC_API_KEY)

# Start PostgreSQL with Docker
docker compose -f docker-compose.dev.yml up -d

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Using Docker (Full Stack)

```bash
# Start everything (app + database)
docker compose up --build

# Run migrations
docker compose run --rm prisma-migrate
```

## Project Structure

```
ai-website-builder/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth API routes
│   │   │   ├── generate/      # AI generation endpoint
│   │   │   └── websites/      # Website CRUD API
│   │   ├── dashboard/         # User dashboard
│   │   ├── editor/[id]/       # Visual website editor
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── editor/            # Editor-specific components
│   │   ├── layout/            # Layout components (navbar, sidebar)
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities (prisma, auth config)
│   └── types/                 # TypeScript type definitions
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   └── unit/                  # Vitest unit tests
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development (DB only)
├── Dockerfile                 # Multi-stage production build
└── CLAUDE.md                  # Agent team configuration
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server

# Database
npx prisma migrate dev   # Run migrations (development)
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Regenerate Prisma client

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run format:check     # Prettier check
```

## Architecture

### Authentication Flow

1. User registers/logs in via NextAuth.js
2. JWT-based sessions stored in cookies
3. Middleware protects `/dashboard` and `/editor` routes
4. API routes verify session before processing requests

### Website Generation Flow

1. User describes their website via natural language prompt
2. Backend sends prompt to Claude API
3. Claude generates structured component data (JSON)
4. Components are rendered in the visual editor
5. User can customize via drag-and-drop and property editing
6. Website is saved to PostgreSQL via Prisma

### Data Model

- **User** → has many **Websites**
- **Website** → has many **Pages**
- **Page** → has many **Components**
- **Component** → stores type, props, styles as JSON

## Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Yes |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) | Yes |
| `ANTHROPIC_API_KEY` | Claude API key for AI generation | Yes |

## Contributing

1. Create a feature branch from `main`
2. Make changes following the coding conventions in `CLAUDE.md`
3. Write tests for new functionality
4. Run `npm run lint && npm run test` before committing
5. Submit a pull request

## License

MIT
