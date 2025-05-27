# CLAUDE.md - Meelio v2 Development Guide

## Project Overview
Meelio is a **productivity-focused Chrome extension and web app** that serves as a Momentum Dashboard competitor. It provides a beautiful new tab experience with focus tools, task management, and ambient features.

## Architecture
- **Monorepo** using Turbo with 3 main apps:
  - `apps/extension/` - Chrome extension (new tab replacement)
  - `apps/web/` - PWA web application
  - `apps/api/` - Express.js backend with PostgreSQL
- **Offline-first** with IndexedDB for local storage
- **Shared packages** for components, stores, and utilities

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Extension**: Plasmo framework (Chrome MV3)
- **State**: Zustand with persistence
- **Database**: PostgreSQL with Drizzle ORM
- **Local Storage**: IndexedDB via Dexie.js

## Free vs Pro Tiers ($5/mo)

| Feature | Free | Pro |
|---------|------|-----|
| **Tasks** | Single list, 50 items, no due dates | Unlimited lists, due dates, recurring, cloud sync |
| **Backgrounds** | Daily HD photo/video | Choose any, upload custom, vision board |
| **Quotes/Mantras** | Daily auto-rotate | Edit, schedule, personal library |
| **Timer & Stats** | Default 25/5/15, session counter | Custom lengths, auto-start, CSV export, weekly email |
| **Soundscapes** | One default track | Full library, multi-track mixer |
| **Site Blocker** | 3 sites, manual | Unlimited, schedules, Focus Mode |
| **Tab Stash** | Once per day | Unlimited stashes, named collections |
| **Breathe Pod** | 4-4-4-4 box breathing | Extra patterns, custom cycles |
| **Widgets** | Clock only | Weather, countdowns, world clocks |
| **Integrations** | None | Google Calendar, Todoist, ClickUp |
| **Analytics** | Basic stats | Streaks, trends dashboard |
| **Support** | Community | Priority support |

## Key Development Commands
```bash
# Install dependencies
yarn install

# Development
npm run dev              # Start all dev servers
npm run dev -- --filter=extension  # Chrome extension only
npm run dev -- --filter=web       # Web app only
npm run dev -- --filter=api       # API only

# Build
npm run build            # Build all apps
npm run package          # Package extension for Chrome Web Store

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio

# Testing & Linting
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
```

## Project Structure
```
meelio-v2/
├── apps/
│   ├── api/             # Express.js backend
│   ├── extension/       # Chrome extension
│   └── web/            # PWA web app
├── packages/
│   ├── shared/         # Shared components & utilities
│   ├── ui/            # UI component library
│   └── core/          # Core business logic
└── docs/              # Documentation
```

## Current Issues & Priorities

### High Priority
1. **Task Categories**: Categories store IDs instead of names, causing sync issues
2. **Performance**: Large bundle size, optimize with code splitting
3. **Timer Integration**: Soundscapes don't integrate with Pomodoro timer
4. **Notifications**: No browser notifications for timer completion

### Medium Priority
1. **Calendar Integration**: Missing Google Calendar support
2. **Meeting Alerts**: No next meeting notifications
3. **Multi-language**: Limited translation coverage
4. **Sync Strategy**: Over-engineered, needs simplification

### Future Enhancements
1. **Weather Widget**: Location-based weather
2. **Analytics Dashboard**: Detailed productivity insights
3. **Mobile App**: Companion mobile application
4. **AI Features**: Smart task suggestions, focus recommendations

## Development Guidelines

### State Management
- Use Zustand for global state
- Persist to IndexedDB for offline support
- Keep sync logic simple (last-write-wins)

### Component Architecture
- Shared components in `packages/shared/`
- Use TypeScript for all new code
- Follow existing Tailwind patterns
- Implement loading states for async operations

### Database Schema
- Tasks support categories (list names)
- Focus sessions track Pomodoro data
- Site blocker stores URL patterns
- All entities have userId for multi-user support

### Premium Features
- Use `useAuthStore` to check `user.isPro`
- Wrap premium features with `<PremiumFeature>` component
- Show clear upgrade prompts for free users
- Implement feature limits in both frontend and API

### Testing Approach
- Unit tests for utilities and stores
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual testing for Chrome extension

## Common Tasks

### Adding a New Feature
1. Define types in `packages/shared/src/types/`
2. Create API endpoint if needed
3. Add Zustand store or extend existing
4. Build UI components
5. Add feature flag for gradual rollout

### Debugging Chrome Extension
1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click "Inspect views: background page"
4. Use Chrome DevTools for debugging

### Database Changes
1. Modify schema in `apps/api/src/db/schema/`
2. Run `npm run db:generate`
3. Review generated migration
4. Run `npm run db:push` to apply

## API Endpoints
- `/v1/auth/*` - Authentication (login, register, logout)
- `/v1/tasks/*` - Task management
- `/v1/focus-sessions/*` - Pomodoro tracking
- `/v1/backgrounds/*` - Wallpaper management
- `/v1/site-blocker/*` - Website blocking
- `/v1/subscription/*` - Pro subscription handling

## Environment Variables
```env
# API
DATABASE_URL=postgresql://...
JWT_SECRET=...
LEMONSQUEEZY_WEBHOOK_SECRET=...

# Extension/Web
VITE_API_URL=http://localhost:3000
VITE_UNSPLASH_ACCESS_KEY=...
```

## Deployment
- **API**: Deploy to Railway/Render with PostgreSQL
- **Web**: Deploy to Vercel/Netlify
- **Extension**: Package and upload to Chrome Web Store

## Support & Resources
- GitHub Issues for bug reports
- Discord community for discussions
- Priority support for Pro users at support@meelio.app




# Sync Store Guide

## Overview

A minimal sync store that handles offline-first syncing for different entity types (tasks, pomodoro sessions, etc.) without over-engineering.

## Features

- **Multi-entity support**: Separate queues for tasks, pomodoro, etc.
- **Sync API**: Just 7 methods to understand
- **Automatic retry**: Failed operations retry up to 3 times
- **Online/offline detection**: Built-in browser event listeners

## Usage

### 1. Add to Sync Queue

```typescript
const syncStore = useSyncStore.getState();

// For tasks
syncStore.addToQueue("task", {
  type: "create",
  entityId: task.id,
  data: task
});

// For pomodoro
syncStore.addToQueue("pomodoro", {
  type: "create", 
  entityId: session.id,
  data: session
});
```

### 2. Process Sync Queue

Each entity type needs its own sync processor:

```typescript
// Task sync (in todo store)
async syncTasks() {
  const queue = syncStore.getQueue("task");
  
  for (const op of queue) {
    try {
      switch (op.type) {
        case "create":
          await taskApi.createTask(op.data);
          syncStore.removeFromQueue("task", op.id);
          break;
        // ... handle update, delete
      }
    } catch (error) {
      syncStore.incrementRetry("task", op.id);
    }
  }
}
```

### 3. Check Sync Status

```typescript
const isSyncingTasks = syncStore.syncingEntities.has("task");
const taskQueue = syncStore.getQueue("task");
const lastTaskSync = syncStore.lastSyncTimes["task"];
```

## Why This Design?

1. **Flexibility**: Easy to add new entity types
2. **No Magic**: You control when and how sync happens
3. **Clear Separation**: Each feature handles its own sync logic
4. **~150 lines total**: Easy to understand and debug

## Adding New Entity Types

1. Add to queue: `syncStore.addToQueue("your-entity", {...})`
2. Create sync function in your store
3. Call sync when online or on timer
4. That's it!

## Example: Tasks vs Pomodoro

```typescript
// Tasks queue operations immediately
syncStore.addToQueue("task", {
  type: "update",
  entityId: taskId,
  data: { completed: true }
});

// Pomodoro might batch sessions
const sessions = getTodaysSessions();
sessions.forEach(session => {
  syncStore.addToQueue("pomodoro", {
    type: "create",
    entityId: session.id,
    data: session
  });
});
```

Both use the same sync store but handle their sync logic independently.