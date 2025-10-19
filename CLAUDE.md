# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Meelio is a productivity and focus application built as a Turborepo monorepo with three main applications: a web app (Next.js/Vite + React), a browser extension (Plasmo), and an Express API backend. The codebase uses TypeScript throughout and shares common code via workspace packages.

## Project Structure

### Applications (`apps/`)

- **api**: Express.js REST API server

  - PostgreSQL database with Drizzle ORM
  - JWT & Google OAuth authentication via Passport.js
  - Lemon Squeezy integration for billing
  - Module-based architecture (auth, billing, tasks, notes, focus-sessions, site-blocker, etc.)

- **web**: React web application

  - Built with Vite + React Router
  - Playwright for E2E testing
  - PWA capabilities via vite-plugin-pwa
  - Runs on port 4000 by default

- **extension**: Browser extension
  - Built with Plasmo framework
  - Supports multiple browsers (Chrome, Firefox, Edge, Opera, Safari)
  - Shares UI components and logic with web app via `@repo/shared`

### Shared Packages (`packages/`)

- **@repo/shared**: Core business logic, API clients, hooks, stores (Zustand), types, utilities

  - Exports organized by domain: `api/*`, `components/*`, `hooks/*`, `stores/*`, `types/*`, `utils/*`
  - Uses Zustand for state management
  - Dexie for IndexedDB operations
  - React Query for server state

- **@repo/ui**: Reusable React components (shadcn/ui based)
- **@repo/logger**: Isomorphic logging utility
- **@repo/eslint-config**: Shared ESLint configuration
- **@repo/typescript-config**: Shared TypeScript configurations
- **@repo/tailwind-config**: Shared Tailwind CSS configuration
- **@repo/prettier-config**: Shared Prettier configuration
- **@repo/jest-presets**: Jest test configurations

## Common Development Commands

### Building

```bash
# Build all apps and packages
yarn build

# Build specific apps
yarn build:api
yarn build:web
yarn build:extension

# Build extension for all browsers
cd apps/extension && npm run build:all
```

### Development

```bash
# Run all apps in development mode
yarn dev

# Run specific apps
yarn start:api      # API server (dev mode)
yarn preview        # Web app preview (production build)
cd apps/web && yarn dev          # Web app (dev mode, port 4000)
cd apps/extension && yarn dev    # Extension (dev mode)
```

### Testing

```bash
# Run all tests
yarn test

# Web app E2E tests (Playwright)
cd apps/web && yarn test           # Run tests
cd apps/web && yarn test:ui        # Run with UI
cd apps/web && yarn test:debug     # Run in debug mode
cd apps/web && yarn test:headed    # Run in headed mode

# API tests (Jest)
cd apps/api && yarn test
```

### Linting & Formatting

```bash
yarn lint           # Lint all packages
yarn format         # Format all TypeScript/TSX/MD files with Prettier
```

### Database (Drizzle ORM)

```bash
# Generate migration with name
yarn db:generate:name name=migration_name

# Generate migration (auto-named)
yarn db:generate

# Run migrations
yarn db:migrate

# Open Drizzle Studio
yarn db:studio

# Seed database
yarn db:seed

# Push schema changes directly (dev only)
yarn db:push

# Generate + migrate
yarn db:up

# Export schema
yarn db:export
```

Database configuration is in `apps/api/drizzle.config.ts`. All schema files are in `apps/api/src/db/schema/`.

### Package Extension

```bash
yarn package        # Package default target
cd apps/extension && npm run package:all      # Package for all browsers
cd apps/extension && npm run package:chrome   # Package for Chrome
cd apps/extension && npm run package:firefox  # Package for Firefox
# Similarly: package:edge, package:brave, package:opera, package:safari
```

### Cleanup

```bash
yarn clean          # Clean all build artifacts
```

## Architecture Notes

### API Server (`apps/api`)

- **Entry point**: `src/index.ts` → `src/server.ts`
- **Routing**: All routes under `/v1/*` namespace (see `src/routes/v1/index.ts`)
- **Module structure**: Each feature module in `src/modules/` contains:

  - `*.controller.ts` - Request handlers
  - `*.service.ts` - Business logic
  - `*.validation.ts` - Request validation schemas (Joi)
  - `*.routes.ts` - Route definitions

- **Database**:

  - Drizzle ORM with PostgreSQL
  - Schema definitions in `src/db/schema/`
  - Migration files in `src/db/drizzle/`

- **Authentication**:

  - JWT strategy (local auth)
  - Google OAuth strategy
  - Both configured via Passport.js

- **Key modules**: auth, billing, subscription (Lemon Squeezy), user, tasks, notes, mantras, focus-sessions, site-blocker, tab-stash, calendar, settings, categories

### Web App (`apps/web`)

- **Entry point**: `src/main.tsx` → `src/app.tsx`
- **Routing**: React Router (see `src/routes/router.tsx`)
- **State**: Primarily managed in `@repo/shared/stores/*` via Zustand
- **Components**: App-specific in `src/components/`, shared in `@repo/shared/components/*` and `@repo/ui`

### Browser Extension (`apps/extension`)

- **Framework**: Plasmo (handles manifest v3 complexity)
- **Entry points**:

  - `src/newtab.tsx` - New tab page
  - `src/popup.tsx` - Extension popup
  - `src/background.ts` - Background service worker
  - `src/content.tsx` - Content script

- **Manifest configuration**: In `package.json` under `manifest` key
- **Storage**: Uses `@plasmohq/storage` for extension storage

### Shared Package (`@repo/shared`)

Critical package that contains most of the business logic shared between web and extension:

- **API clients**: `src/api/*` - Axios-based API clients for each resource
- **Stores**: `src/stores/*` - Zustand stores for global state
- **Hooks**: `src/hooks/*` - Reusable React hooks
- **Types**: `src/types/*` - TypeScript type definitions
- **Utils**: `src/utils/*` - Utility functions
- **Components**: `src/components/*` - Shared React components
- **i18n**: `src/i18n/*` - Internationalization setup
- **Providers**: `src/providers/*` - React context providers

When adding features that should work in both web and extension, add them to `@repo/shared`.

## Environment Variables

### API (`apps/api/.env`)

Required variables (see `apps/api/.env.example`):

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DB_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_ACCESS_EXPIRATION_MINUTES` - Access token expiry (default: 1440)
- `JWT_REFRESH_EXPIRATION_DAYS` - Refresh token expiry (default: 30)
- `CLIENT_URL` - Frontend URL for CORS
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `LEMON_SQUEEZY_SIGNING_SECRET`, `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID` - Billing integration
- SMTP settings for email

Database setup example:

```bash
docker run --name meelio -e POSTGRES_PASSWORD=password -e POSTGRES_DB=meeliodb -d -p 5433:5432 postgres
```

### Web (`apps/web/.env`)

- `NEXT_PUBLIC_API_HOST` - API server URL

## Technology Stack

- **Languages**: TypeScript throughout
- **Frontend**: React 18, React Router, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **UI Components**: Custom components based on shadcn/ui patterns
- **Icons**: Lucide React
- **Testing**: Jest (API), Playwright (web E2E)
- **Build System**: Turborepo
- **Package Manager**: Yarn (v1.22.19)
- **Authentication**: Passport.js (JWT + Google OAuth)
- **Billing**: Lemon Squeezy
- **Browser Extension**: Plasmo framework
- **Animations**: Framer Motion, GSAP
- **i18n**: i18next + react-i18next

## Development Workflow

1. **Adding a new feature module to API**:

   - Create module directory in `apps/api/src/modules/{feature}/`
   - Add schema to `apps/api/src/db/schema/{feature}.schema.ts`
   - Export schema in `apps/api/src/db/schema/index.ts`
   - Generate migration: `yarn db:generate:name name=add_{feature}`
   - Run migration: `yarn db:migrate`
   - Create controller, service, validation, and routes files
   - Register routes in `apps/api/src/routes/v1/index.ts`

2. **Adding a new feature to web/extension**:

   - Add shared logic (stores, hooks, API clients) to `packages/shared/src/`
   - Add UI components to `packages/ui/src/` (if reusable) or app-specific `src/components/`
   - Update routes in respective app's router

3. **Before committing**:
   - Run `yarn lint` to check for linting errors
   - Run `yarn test` to ensure tests pass
   - Run `yarn build` to verify build succeeds

## Version Management

- All packages share the same version number (currently 0.6.6)
- Web app uses `standard-version` for changelog/releases: `yarn release`
