# Meelio

A productivity and focus application built as a Turborepo monorepo. Meelio is **fully offline-first** - all data is stored locally using IndexedDB and localStorage.

## What's inside?

This Turborepo includes the following:

### Apps

- `web`: A [Vite](https://vitejs.dev/) + [React](https://reactjs.org/) web application
- `extension`: A [Plasmo](https://docs.plasmo.com/) browser extension

### Packages

- `@repo/shared`: Core business logic, stores, hooks, and components shared between web and extension
- `@repo/ui`: A React component library (shadcn/ui based)
- `@repo/logger`: Isomorphic logger utility
- `@repo/eslint-config`: ESLint presets
- `@repo/typescript-config`: TypeScript configurations
- `@repo/tailwind-config`: Tailwind CSS configuration
- `@repo/prettier-config`: Prettier configuration
- `@repo/jest-presets`: Jest configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.15+

### Installation

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Build all apps
pnpm build
```

### Development

```bash
# Web app (port 4000)
cd apps/web && pnpm dev

# Browser extension
cd apps/extension && pnpm dev
```

### Building

```bash
# Build everything
pnpm build

# Build specific apps
pnpm build:web
pnpm build:extension
```

## Features

- **Timer/Pomodoro**: Focus sessions with customizable work/break intervals
- **Soundscapes**: Ambient sounds for focus (offline-capable)
- **Tasks**: Todo list with local persistence
- **Notes**: Markdown notes with local storage
- **Site Blocker**: Block distracting websites (extension only)
- **Tab Stash**: Save and restore browser tabs (extension only)
- **Bookmarks**: Quick access to bookmarks (extension only)
- **Calendar**: ICS calendar integration
- **Backgrounds**: Customizable backgrounds and themes

## Technology Stack

- **Frontend**: React 18, Vite, React Router
- **State**: Zustand with localStorage persistence
- **Database**: Dexie (IndexedDB)
- **Styling**: Tailwind CSS, shadcn/ui
- **Build**: Turborepo, pnpm
- **Extension**: Plasmo framework
- **i18n**: i18next

## Utilities

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Playwright](https://playwright.dev/) for E2E testing
