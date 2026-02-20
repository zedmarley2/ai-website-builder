# CLAUDE.md - AI Website Builder

## Project Overview

AI Website Builder - a platform that uses Claude to generate, customize, and deploy websites through natural language prompts and a visual editor.

## Build & Run Commands

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Start Next.js dev server on port 3000
npm run build                  # Production build
npm run start                  # Start production server

# Database
docker compose -f docker-compose.dev.yml up -d   # Start PostgreSQL
npx prisma migrate dev         # Run migrations (development)
npx prisma migrate deploy      # Run migrations (production)
npx prisma generate            # Regenerate Prisma client
npx prisma studio              # Database GUI on port 5555

# Testing
npm run test                   # Run Vitest unit tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests with interactive UI

# Code Quality
npm run lint                   # ESLint check
npm run lint:fix               # ESLint auto-fix
npm run format                 # Prettier format all files
npm run format:check           # Prettier check formatting

# Docker
docker compose up --build      # Start full stack (app + db)
docker compose down            # Stop all services
docker compose -f docker-compose.dev.yml up -d  # DB only for local dev
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js) with JWT sessions
- **AI**: Claude API via Anthropic SDK
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Docker multi-stage builds + Docker Compose

### Key Directories
```
src/app/              → Next.js App Router pages and API routes
src/app/api/          → REST API endpoints
src/components/ui/    → Reusable UI primitives (Button, Input, Card, Modal)
src/components/editor/→ Website editor components (Canvas, Palette, Properties)
src/components/layout/→ Layout components (Navbar, Sidebar)
src/hooks/            → Custom React hooks
src/lib/              → Shared utilities (prisma client, auth config)
src/types/            → TypeScript types and Zod schemas
prisma/               → Database schema and migrations
tests/unit/           → Vitest unit tests
tests/e2e/            → Playwright E2E tests
```

### Data Flow
```
User Prompt → /api/generate → Claude API → Structured JSON → Editor Canvas → Save → PostgreSQL
```

### Database Models
- **User** → owns many Websites (NextAuth-managed)
- **Website** → has many Pages (name, subdomain, published status)
- **Page** → has many Components (slug, order, content JSON)
- **Component** → atomic UI block (type, props JSON, styles JSON, order)

## Coding Conventions

### General
- TypeScript strict mode - no `any` unless unavoidable (use `unknown` instead)
- Use named exports, not default exports (except for Next.js pages)
- Prefer `const` over `let`, never use `var`
- Use early returns to reduce nesting
- Keep functions under 50 lines; extract helpers when they grow

### React / Next.js
- Use Server Components by default; add `"use client"` only when needed
- Colocate components with their pages when single-use
- Shared components go in `src/components/`
- Use `React.forwardRef` for all UI primitives
- Props interfaces named `{ComponentName}Props`

### File Naming
- Components: `PascalCase.tsx` or `kebab-case.tsx` (kebab preferred for this project)
- Utilities: `kebab-case.ts`
- Types: `kebab-case.ts`
- Tests: `{name}.test.ts` or `{name}.test.tsx`
- E2E: `{feature}.spec.ts`

### API Routes
- Always validate input with Zod schemas
- Always verify authentication via `auth()` from `@/lib/auth`
- Return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Return JSON with consistent shape: `{ data }` or `{ error: string }`
- Handle errors with try/catch, never expose internal errors to client

### Database
- Use Prisma for all database access
- Import prisma client from `@/lib/prisma` (singleton pattern)
- Use transactions for multi-model operations
- Always include `select` or `include` to avoid over-fetching
- UUID for all primary keys

### Styling
- Tailwind CSS 4 utility classes for all styling
- No inline styles or CSS modules
- Framer Motion for animations (`motion.div`, `AnimatePresence`)
- Dark mode via Tailwind `dark:` variants
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints

### Testing
- Unit tests for utility functions, hooks, and component rendering
- E2E tests for critical user flows (auth, create website, edit)
- Test file mirrors source structure: `tests/unit/components/button.test.tsx`
- Use `describe`/`it` blocks, descriptive test names
- Mock external services (Prisma, Auth) in unit tests

### Git Workflow
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- One logical change per commit
- Run `npm run lint && npm run test` before committing

---

## Agent Team Roles

This project is designed for development with Claude Code Agent Teams. Each agent has a specialized role with defined responsibilities and communication patterns.

### Team Structure

```
┌─────────────────────────────────────────────────────┐
│                   Orchestrator                       │
│                  (Team Lead)                         │
│                                                      │
│  Decomposes tasks, assigns work, resolves conflicts  │
│  Manages sprint backlog and priorities               │
└──────┬──────┬──────┬──────┬──────┬──────────────────┘
       │      │      │      │      │
  ┌────▼──┐┌──▼───┐┌─▼────┐┌▼─────┐┌▼──────────┐
  │UI/UX  ││Front ││Back  ││Cont- ││QA &       │
  │Design ││end   ││end   ││ent   ││Deployment │
  │Agent  ││Dev   ││Dev   ││Gen   ││Agent      │
  └───────┘└──────┘└──────┘└──────┘└───────────┘
```

### 1. Orchestrator (Team Lead)

**Role**: Project coordinator and decision maker

**Responsibilities**:
- Decompose user requests into actionable tasks
- Assign tasks to specialized agents
- Resolve conflicts between agents (e.g., API contract disagreements)
- Maintain project-wide consistency
- Review and approve cross-cutting changes
- Manage the task list and sprint priorities

**Tools & Access**:
- Full read access to all files
- TaskCreate, TaskUpdate, TaskList for backlog management
- SendMessage for agent coordination
- Final approval on merges and deployments

**Decision Authority**:
- Architecture changes
- Technology choices
- Priority conflicts between agents
- Release decisions

---

### 2. UI/UX Designer Agent

**Role**: Design system owner and user experience advocate

**Responsibilities**:
- Define and maintain the component design system in `src/components/ui/`
- Create Tailwind CSS theme configuration and design tokens
- Design page layouts and user flows
- Ensure accessibility (WCAG 2.1 AA) and responsive design
- Review visual consistency across all pages
- Define Framer Motion animation patterns

**Owned Files**:
- `src/components/ui/*` — all UI primitives
- `src/app/globals.css` — global styles and CSS custom properties
- Tailwind configuration

**Communication**:
- Receives mockup/design tasks from Orchestrator
- Provides component specs to Frontend Developer
- Reviews frontend PRs for design consistency

**Key Conventions**:
- Every UI component must support dark mode
- Components use `React.forwardRef` and accept `className` prop
- Animation duration: 150ms (micro), 300ms (standard), 500ms (page transitions)
- Color palette: use Tailwind's built-in palette; primary = indigo, accent = violet

---

### 3. Frontend Developer Agent

**Role**: React/Next.js implementation specialist

**Responsibilities**:
- Implement pages in `src/app/` using App Router patterns
- Build interactive features (editor, drag-drop, real-time preview)
- Integrate with backend API routes via custom hooks
- Manage client-side state and form handling
- Implement error boundaries and loading states
- Write component unit tests

**Owned Files**:
- `src/app/(auth)/*` — auth pages
- `src/app/dashboard/*` — dashboard
- `src/app/editor/*` — website editor
- `src/app/page.tsx` — landing page
- `src/components/editor/*` — editor components
- `src/components/layout/*` — layout components
- `src/hooks/*` — custom hooks
- `tests/unit/components/*` — component tests

**Communication**:
- Receives UI specs from UI/UX Designer
- Consumes API contracts from Backend Developer
- Reports bugs to QA Agent
- Requests design clarification from UI/UX Designer

**Key Conventions**:
- Server Components by default; `"use client"` only for interactivity
- Data fetching: server components use `prisma` directly, client components use hooks + API
- Error handling: ErrorBoundary for component trees, try/catch in event handlers
- Loading: use Next.js `loading.tsx` for route-level, Suspense for component-level

---

### 4. Backend Developer Agent

**Role**: API and database specialist

**Responsibilities**:
- Design and implement API routes in `src/app/api/`
- Manage Prisma schema and migrations
- Implement authentication logic and middleware
- Build the AI generation pipeline (Claude API integration)
- Optimize database queries and add indexes
- Write API unit tests

**Owned Files**:
- `src/app/api/*` — all API routes
- `src/lib/*` — shared backend utilities
- `src/middleware.ts` — Next.js middleware
- `src/types/*` — shared types and Zod schemas
- `prisma/*` — schema and migrations
- `tests/unit/lib/*` — backend tests

**Communication**:
- Publishes API contracts (Zod schemas in `src/types/`)
- Receives feature requirements from Orchestrator
- Coordinates with Content Generator on AI pipeline
- Reports API changes to Frontend Developer

**Key Conventions**:
- Every route handler: validate input → check auth → business logic → return response
- Always use Zod for request/response validation
- Prisma queries: always scope to authenticated user (prevent data leaks)
- AI generation: structured output with JSON mode, retry with exponential backoff

---

### 5. Content Generator Agent

**Role**: AI prompt engineering and content specialist

**Responsibilities**:
- Design and refine Claude API prompts for website generation
- Create component templates and default content
- Build the prompt → structured JSON pipeline
- Maintain a library of website templates (SaaS, portfolio, blog, etc.)
- Generate SEO-friendly content (meta tags, headings, copy)
- Test generation quality and handle edge cases

**Owned Files**:
- `src/lib/ai/*` — AI generation logic and prompts (future)
- `src/app/api/generate/*` — generation endpoint
- Template and prompt files

**Communication**:
- Receives generation requirements from Orchestrator
- Works with Backend Developer on API integration
- Provides generated component specs to Frontend Developer
- Iterates on prompt quality with QA Agent

**Key Conventions**:
- Prompts use structured output (JSON schema) for reliable parsing
- All generated content must be safe (no XSS vectors in generated HTML)
- Templates define: component hierarchy, default props, placeholder content
- Generation includes responsive variants (mobile, tablet, desktop)

---

### 6. QA & Deployment Agent

**Role**: Quality assurance and infrastructure specialist

**Responsibilities**:
- Write and maintain E2E tests in `tests/e2e/`
- Run full test suite and report failures
- Manage Docker configuration and CI/CD
- Monitor build health and bundle size
- Perform security audits (dependency vulnerabilities, auth flows)
- Manage environment configuration and secrets

**Owned Files**:
- `tests/e2e/*` — Playwright E2E tests
- `Dockerfile` — production image
- `docker-compose.yml` — production orchestration
- `docker-compose.dev.yml` — development setup
- `.github/workflows/*` — CI/CD pipelines (future)
- `.env.example` — environment template

**Communication**:
- Receives test requirements from Orchestrator
- Reports test failures to relevant agent (Frontend/Backend)
- Approves deployments after all tests pass
- Alerts team on security vulnerabilities

**Key Conventions**:
- E2E tests cover all critical paths: auth, create website, edit, publish
- Tests must pass before any merge to main
- Docker image: multi-stage build, <200MB final image
- Zero-downtime deployments with health checks
- Environment secrets never committed; use `.env.example` as template

---

## Agent Communication Protocol

### Task Assignment Flow
```
1. User request → Orchestrator decomposes into tasks
2. Orchestrator creates tasks via TaskCreate
3. Orchestrator assigns tasks via TaskUpdate (owner field)
4. Agents work on assigned tasks
5. Agents mark tasks completed via TaskUpdate
6. Orchestrator reviews and integrates
```

### Conflict Resolution
- **API contract disputes**: Backend Developer has authority, Frontend adapts
- **Design vs implementation**: UI/UX Designer has authority on visuals
- **Performance vs features**: Orchestrator decides priority
- **Test failures block deployment**: QA Agent has veto power

### Cross-Agent Dependencies
```
UI/UX Designer → (component specs) → Frontend Developer
Backend Developer → (API contracts / Zod schemas) → Frontend Developer
Content Generator → (generation pipeline) → Backend Developer
All Agents → (code changes) → QA & Deployment Agent (testing)
```
