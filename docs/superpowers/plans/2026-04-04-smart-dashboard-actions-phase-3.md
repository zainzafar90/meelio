# Smart Dashboard Actions Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the focus dashboard more decisive by grounding it in the pinned task and by making agenda timing affect the dashboard guidance.

**Architecture:** Extend the existing focus-dashboard contracts, pure core derivation, application snapshot handling, and shared dashboard composition. Reuse the task store's pinned-task behavior rather than creating a new focus-task system.

**Tech Stack:** React, TypeScript, Zustand, existing `@repo/*` layered packages, web + extension app surfaces

---

### Task 1: Extend Focus Dashboard Contracts

**Files:**
- Modify: `packages/contracts/src/focus-dashboard/contracts.ts`
- Test: `packages/contracts/src/focus-dashboard/contracts.test.ts`

- [ ] Step 1: Add active-focus and agenda-window snapshot fields
- [ ] Step 2: Keep contracts runtime-agnostic
- [ ] Step 3: Verify contracts package tests pass

### Task 2: Extend Pure Focus Dashboard Derivation

**Files:**
- Modify: `packages/core/src/focus-dashboard/focus-dashboard-core.ts`
- Test: `packages/core/src/focus-dashboard/focus-dashboard-core.test.ts`

- [ ] Step 1: Derive active-focus task copy from the pinned/top task
- [ ] Step 2: Derive agenda-window guidance from time until the next event
- [ ] Step 3: Make primary CTA copy responsive to task and agenda state
- [ ] Step 4: Verify core package tests pass

### Task 3: Extend Application Snapshot Composition

**Files:**
- Modify: `packages/application/src/focus-dashboard/create-focus-dashboard-store.ts`
- Test: `packages/application/src/focus-dashboard/create-focus-dashboard-store.test.ts`

- [ ] Step 1: Pass active-focus and agenda timing signals into the snapshot
- [ ] Step 2: Keep the application layer dependent on contracts/core only
- [ ] Step 3: Verify application package tests pass

### Task 4: Refine Shared Dashboard Composition

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx`
- Modify: `packages/shared/src/stores/focus-dashboard.store.ts`
- Test: targeted shared tests if behavior moves there

- [ ] Step 1: Surface the active focus task in the hero and task list
- [ ] Step 2: Make the primary CTA reference the active task when available
- [ ] Step 3: Add agenda-window guidance to the agenda card and hero copy
- [ ] Step 4: Add task actions for explicit "focus this" behavior
- [ ] Step 5: Verify the UI still feels calm and uncluttered

### Task 5: Validation

**Files:**
- Modify: relevant tests only

- [ ] Step 1: Run affected package tests
- [ ] Step 2: Run shared tests
- [ ] Step 3: Run web and extension builds
- [ ] Step 4: Review final structure against `docs/architecture/layered-architecture.md`
