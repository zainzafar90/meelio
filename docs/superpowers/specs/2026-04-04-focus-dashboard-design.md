# Focus Dashboard Design

**Goal:** Turn Meelio from a collection of useful focus widgets into a coherent daily dashboard that helps users decide what matters now, enter focus quickly, and understand what comes next.

## Product Thesis

Current Meelio has breadth. It already offers timer, blocker, soundscapes, tasks, notes, bookmarks, tab stash, greetings, quote, backgrounds, and calendar-related UI. What it lacks is a canonical surface that composes those features into a day-oriented product loop.

The dashboard should feel like a calm, premium command center for a focused day:

- orient the user when they open a new tab
- surface what matters now
- make focus session start frictionless
- connect planning, schedule, and execution
- preserve Meelio's soft, ambient, design-forward tone rather than becoming a dense enterprise dashboard

## Design Language Guardrails

New features should preserve the existing Meelio character:

- calm and spacious, not hyper-dense
- premium ambient visuals, not productivity-tool clutter
- strong hierarchy with one primary action per state
- modular cards/surfaces with clean composition
- motion and atmosphere should support focus, not compete with it
- AI should feel invisible and useful, not chat-first

This means new feature work should prefer:

- dashboard cards over standalone panels
- contextual summaries over raw data dumps
- ambient assistance over explicit assistant chrome
- orchestration over duplication

## Feature Framework

### Tier 1: Core Dashboard

These define the actual product:

1. Today Dashboard
2. Daily Focus Plan
3. Unified Focus Session
4. Agenda / Today Timeline
5. Quick Capture
6. Daily Recap

### Tier 2: Supporting Utility

These become valuable after the core loop exists:

- event and deadline countdowns
- world clocks and meeting-time helpers
- routines / rituals
- progress targets
- smarter resurfacing of tabs, bookmarks, and unfinished items

### Tier 3: AI Features

AI should improve clarity, planning, and reflection:

- daily brief
- session planning assistant
- task condensation
- end-of-day reflection summary
- focus interruption insights

AI should not initially ship as:

- a generic chatbot
- an omnipresent assistant panel
- auto-generated fluff

### Tier 4: Infrastructure and Sync

These are important but should follow product clarity:

- Hono API
- Cloudflare deployment
- auth-backed sync
- calendar service integrations
- server-backed AI endpoints

## Recommended First Chunk

### Chunk 1: Focus Dashboard Shell

This is the first thing to implement.

It includes:

- a canonical Today Dashboard shell
- a Daily Focus Plan card
- a Unified Focus Session entrypoint

Why this first:

- it creates a real product loop immediately
- it reuses existing timer/blocker/soundscape capabilities
- it defines the information architecture for future dashboard features
- it avoids premature backend work

### Chunk 1 UX Outcomes

When a user opens the new dashboard, they should be able to:

- understand the day at a glance
- set or review their top priorities
- see current timer/focus state
- start a focus session from one primary CTA
- feel that the dashboard is coherent and intentional

## Proposed Feature Order

1. Focus Dashboard Shell
2. Agenda / Today Timeline
3. Quick Capture
4. Daily Recap and progress layer
5. Countdowns and schedule-aware utility cards
6. Rituals / routines
7. AI summaries and planning
8. Hono API and Cloudflare deployment

## Architecture Direction

To keep the structure clean:

- contracts for dashboard-specific shared DTOs and commands go in `packages/contracts`
- pure dashboard derivation and planning rules go in `packages/core`
- orchestration and state composition go in `packages/application`
- calendar/runtime/host adapters go in `packages/platform`
- persistence and future API clients go in `packages/infrastructure`
- UI composition stays in `apps/*` and, where necessary, transitional `packages/shared`

Avoid placing new product logic into `packages/shared` unless it is explicitly a compatibility wrapper or shared presentational composition.

## Non-Goals For Chunk 1

- no full backend rollout
- no broad sync story
- no generic AI chat interface
- no feature explosion in the first pass
- no copying old repos directly

The older projects can inform scope and polish, but this implementation should be cleaner and more intentional.
