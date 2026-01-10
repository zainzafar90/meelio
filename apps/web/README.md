# Meelio Web App

A Vite + React web application for productivity and focus.

## Getting Started

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run development server (port 4000)
pnpm dev
```

Open [http://localhost:4000](http://localhost:4000) with your browser.

## Development

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

## Testing

```bash
# Run E2E tests (Playwright)
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests in debug mode
pnpm test:debug

# Run tests in headed mode
pnpm test:headed
```

## Technology Stack

- [Vite](https://vitejs.dev/) - Build tool
- [React](https://reactjs.org/) - UI framework
- [React Router](https://reactrouter.com/) - Routing
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Dexie](https://dexie.org/) - IndexedDB wrapper
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Playwright](https://playwright.dev/) - E2E testing

## Data Storage

All data is stored locally in the browser:

- **IndexedDB**: Tasks, notes, focus sessions, sounds cache
- **localStorage**: User preferences, theme, settings
