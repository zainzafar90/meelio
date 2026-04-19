# Quick Capture Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the focus dashboard actionable by adding quick capture and inline dashboard task actions.

**Architecture:** Add capture-specific contracts and orchestration in layered packages, then compose a compact dashboard capture surface in shared UI. Reuse existing task and note stores instead of reimplementing them.

**Tech Stack:** React, TypeScript, Zustand, existing `@repo/*` layered packages, web + extension app surfaces

---

### Task 1: Define Quick Capture Contracts

**Files:**
- Create: `packages/contracts/src/quick-capture/contracts.ts`
- Create: `packages/contracts/src/quick-capture/index.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/package.json`
- Test: `packages/contracts/src/quick-capture/contracts.test.ts`

- [ ] Step 1: Define capture mode, draft, and submission result contracts
- [ ] Step 2: Add export coverage tests
- [ ] Step 3: Verify contracts package tests pass

### Task 2: Add Pure Capture Draft Logic

**Files:**
- Create: `packages/core/src/quick-capture/quick-capture-core.ts`
- Create: `packages/core/src/quick-capture/index.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`
- Test: `packages/core/src/quick-capture/quick-capture-core.test.ts`

- [ ] Step 1: Add pure helpers for validating and normalizing capture drafts
- [ ] Step 2: Keep logic host-agnostic
- [ ] Step 3: Verify core package tests pass

### Task 3: Add Application-Orchestrated Quick Capture Actions

**Files:**
- Create: `packages/application/src/quick-capture/create-quick-capture-store.ts`
- Create: `packages/application/src/quick-capture/index.ts`
- Modify: `packages/application/src/index.ts`
- Modify: `packages/application/package.json`
- Test: `packages/application/src/quick-capture/create-quick-capture-store.test.ts`

- [ ] Step 1: Create capture state and submit actions for task/note modes
- [ ] Step 2: Keep orchestration dependent on contracts/core only
- [ ] Step 3: Verify application package tests pass

### Task 4: Compose Quick Capture Into the Dashboard

**Files:**
- Create: `packages/shared/src/components/core/quick-capture/`
- Create: `packages/shared/src/stores/quick-capture.store.ts`
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx`
- Modify: `packages/shared/src/components/index.ts`
- Modify: `packages/shared/src/stores/index.ts`
- Test: targeted shared tests for quick capture and dashboard actions

- [ ] Step 1: Add a compact capture bar to the dashboard
- [ ] Step 2: Connect task submission to the existing task store
- [ ] Step 3: Connect note submission to the existing note store
- [ ] Step 4: Add inline task actions to the dashboard list
- [ ] Step 5: Verify the dashboard remains visually calm and uncluttered

### Task 5: Validation

**Files:**
- Modify: relevant tests only

- [ ] Step 1: Run affected package tests
- [ ] Step 2: Run shared tests
- [ ] Step 3: Run web and extension builds
- [ ] Step 4: Review final structure against `docs/architecture/layered-architecture.md`
