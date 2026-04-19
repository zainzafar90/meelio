# Focus Dashboard Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real focus dashboard slice by introducing a canonical Today Dashboard, a Daily Focus Plan, and a unified focus session entrypoint.

**Architecture:** Add dashboard-specific contracts, pure derivation logic, and orchestration in layered packages before composing the UI in app/shared surfaces. Reuse existing timer, blocker, soundscape, task, and calendar primitives rather than duplicating them.

**Tech Stack:** React, TypeScript, Zustand, existing `@repo/*` layered packages, web + extension app surfaces

---

### Task 1: Define Dashboard Product Contracts

**Files:**
- Create: `packages/contracts/src/focus-dashboard/contracts.ts`
- Create: `packages/contracts/src/focus-dashboard/index.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/focus-dashboard/contracts.test.ts`

- [ ] Step 1: Define the dashboard and daily-plan contracts
- [ ] Step 2: Add tests covering contract shape and exports
- [ ] Step 3: Verify contract package tests pass

### Task 2: Add Pure Dashboard Derivation Logic

**Files:**
- Create: `packages/core/src/focus-dashboard/focus-dashboard-core.ts`
- Create: `packages/core/src/focus-dashboard/index.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/focus-dashboard/focus-dashboard-core.test.ts`

- [ ] Step 1: Add pure functions for deriving today summary, primary CTA state, and dashboard card priority
- [ ] Step 2: Keep inputs host-agnostic and based on contracts
- [ ] Step 3: Verify core package tests pass

### Task 3: Add Application-Orchestrated Focus Dashboard Store

**Files:**
- Create: `packages/application/src/focus-dashboard/create-focus-dashboard-store.ts`
- Create: `packages/application/src/focus-dashboard/index.ts`
- Modify: `packages/application/src/index.ts`
- Test: `packages/application/src/focus-dashboard/create-focus-dashboard-store.test.ts`

- [ ] Step 1: Create an application store/composer that combines focus-plan state and existing feature signals
- [ ] Step 2: Define clean dependencies on contracts/core only
- [ ] Step 3: Verify application package tests pass

### Task 4: Add Persistence and Runtime Adapters

**Files:**
- Create: `packages/infrastructure/src/focus-dashboard/index.ts`
- Create: `packages/infrastructure/src/focus-dashboard/daily-focus-storage.ts`
- Modify: `packages/infrastructure/src/index.ts`
- Test: `packages/infrastructure/src/focus-dashboard/daily-focus-storage.test.ts`

- [ ] Step 1: Add persistence for daily focus plan state
- [ ] Step 2: Keep persistence concrete and separate from orchestration
- [ ] Step 3: Verify infrastructure package tests pass

### Task 5: Compose Focus Dashboard UI

**Files:**
- Create: `packages/shared/src/components/core/focus-dashboard/`
- Create: `packages/shared/src/stores/focus-dashboard.store.ts`
- Modify: `packages/shared/src/components/index.ts`
- Modify: `apps/web/src/routes/home/home.tsx`
- Modify: `apps/extension/src/newtab.tsx`
- Test: targeted UI and boundary tests in web/extension/shared packages

- [ ] Step 1: Build a dashboard shell with clear primary, secondary, and ambient regions
- [ ] Step 2: Add Daily Focus Plan card
- [ ] Step 3: Add Unified Focus Session CTA wired to existing timer/blocker/soundscape behavior
- [ ] Step 4: Replace or reorder the current home/newtab composition to reflect the dashboard hierarchy
- [ ] Step 5: Verify web and extension flows render correctly

### Task 6: Validation and Boundary Guardrails

**Files:**
- Modify: existing package boundary tests as needed
- Create: dashboard-specific boundary tests where needed

- [ ] Step 1: Add tests proving new dashboard code uses layered package imports rather than filesystem paths
- [ ] Step 2: Run package tests
- [ ] Step 3: Run app tests most affected by the new dashboard composition
- [ ] Step 4: Review final structure against `docs/architecture/layered-architecture.md`

## Recommended Future Chunks

- Chunk 2: Agenda / Today Timeline
- Chunk 3: Quick Capture
- Chunk 4: Daily Recap
- Chunk 5: Countdowns, world clocks, and schedule-aware utility cards
- Chunk 6: AI summaries and planning
- Chunk 7: Hono API + Cloudflare deployment
