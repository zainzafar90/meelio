# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Meelio is a productivity and focus application built as a Turborepo monorepo with two main applications: a web app (Vite + React) and a browser extension (Plasmo). The application is **fully offline-first** - all data is stored locally using IndexedDB (Dexie) and localStorage. There is no backend server or user accounts.

## Project Structure

### Applications (`apps/`)

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

- **@repo/shared**: Core business logic, hooks, stores (Zustand), types, utilities
  - Exports organized by domain: `components/*`, `hooks/*`, `stores/*`, `types/*`, `utils/*`
  - Uses Zustand for state management with localStorage persistence
  - Dexie for IndexedDB operations (offline data storage)

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
pnpm build

# Build specific apps
pnpm build:web
pnpm build:extension

# Build extension for all browsers
cd apps/extension && pnpm run build:all
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm preview                     # Web app preview (production build)
cd apps/web && pnpm dev          # Web app (dev mode, port 4000)
cd apps/extension && pnpm dev    # Extension (dev mode)
```

### Testing

```bash
# Run all tests
pnpm test

# Web app E2E tests (Playwright)
cd apps/web && pnpm test           # Run tests
cd apps/web && pnpm test:ui        # Run with UI
cd apps/web && pnpm test:debug     # Run in debug mode
cd apps/web && pnpm test:headed    # Run in headed mode
```

### Linting & Formatting

```bash
pnpm lint           # Lint all packages
pnpm format         # Format all TypeScript/TSX/MD files with Prettier
```

### Package Extension

```bash
pnpm package        # Package default target
cd apps/extension && pnpm run package:all      # Package for all browsers
cd apps/extension && pnpm run package:chrome   # Package for Chrome
cd apps/extension && pnpm run package:firefox  # Package for Firefox
# Similarly: package:edge, package:brave, package:opera, package:safari
```

### Cleanup

```bash
pnpm clean          # Clean all build artifacts
```

## Architecture Notes

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

- **Stores**: `src/stores/*` - Zustand stores for global state (persisted to localStorage)
- **Hooks**: `src/hooks/*` - Reusable React hooks
- **Types**: `src/types/*` - TypeScript type definitions
- **Utils**: `src/utils/*` - Utility functions
- **Components**: `src/components/*` - Shared React components
- **i18n**: `src/i18n/*` - Internationalization setup
- **Providers**: `src/providers/*` - React context providers
- **Database**: `src/lib/db/*` - Dexie (IndexedDB) database for offline data

When adding features that should work in both web and extension, add them to `@repo/shared`.

## Data Storage (Offline-First)

All data is stored locally - there is no backend server:

- **IndexedDB (via Dexie)**: Primary storage for all user data
  - Tasks, notes, focus sessions, site blockers, bookmarks, tab stashes
  - Sound files cached for offline playback
  - Located in `packages/shared/src/lib/db/meelio.dexie.ts`

- **localStorage**: Zustand store persistence
  - User preferences, settings, UI state
  - Theme, dock configuration, timer settings

- **Chrome Storage**: Extension-specific settings (when running as extension)

## Environment Variables

### Web (`apps/web/.env`)

- `VITE_CDN_URL` - CDN URL for sound files
- `VITE_DEV` - Development mode flag

### Extension (`apps/extension/.env`)

- `PLASMO_PUBLIC_CDN_URL` - CDN URL for sound files
- `PLASMO_PUBLIC_DEV` - Development mode flag

## Technology Stack

- **Languages**: TypeScript throughout
- **Frontend**: React 18, React Router, Vite
- **State Management**: Zustand with localStorage persistence
- **Local Database**: Dexie (IndexedDB wrapper)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **UI Components**: Custom components based on shadcn/ui patterns
- **Icons**: Lucide React
- **Testing**: Playwright (web E2E)
- **Build System**: Turborepo
- **Package Manager**: pnpm (v9.15.4)
- **Browser Extension**: Plasmo framework
- **Animations**: Framer Motion, GSAP
- **i18n**: i18next + react-i18next

## Development Workflow

1. **Adding a new feature to web/extension**:
   - Add shared logic (stores, hooks) to `packages/shared/src/`
   - Add UI components to `packages/ui/src/` (if reusable) or app-specific `src/components/`
   - Update routes in respective app's router
   - Add Dexie table if data persistence needed

2. **Adding a new data entity**:
   - Add Dexie table in `packages/shared/src/lib/db/meelio.dexie.ts`
   - Create Zustand store in `packages/shared/src/stores/`
   - Use IndexedDB for data, localStorage for preferences

3. **Before committing**:
   - Run `pnpm lint` to check for linting errors
   - Run `pnpm build` to verify build succeeds

## Version Management

- All packages share the same version number (currently 0.7.0)
- Web app uses `standard-version` for changelog/releases: `pnpm release`
