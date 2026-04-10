# Zen CTA Pill Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the home-shell Zen entry point into the first top pill and surface the existing Zen launch content from an anchored popover instead of a persistent bottom rail.

**Architecture:** Keep Zen orchestration and derived-state wiring unchanged. Refactor only the home-shell presentation layer so the first pill becomes the trigger, the launch rail content becomes popover content, and the old bottom section is removed.

**Tech Stack:** React, TypeScript, Radix Popover via `@repo/ui`, Tailwind CSS, Vitest, Vite builds

---

## Chunk 1: Shell Composition

### Task 1: Replace the persistent bottom rail with a pill-anchored popover

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/components/home-mode-shell.tsx`
- Modify: `packages/shared/src/components/core/focus-dashboard/components/zen-launch-rail.tsx`
- Modify: `packages/shared/src/components/core/focus-dashboard/components/ambient-pill.tsx`

- [ ] **Step 1: Preserve the existing Zen launch content contract**

Confirm `homeModeProps` already carries the launch copy, status items, and actions needed by the popover so no store or derived-state changes are required.

- [ ] **Step 2: Convert the first top pill into the Zen trigger**

Render the Zen trigger in the top pill lane and keep the calendar/task pills in place so the shell still reads as one ambient chrome row.

- [ ] **Step 3: Move launch content into popover content**

Reuse the existing headline, subtitle, status summary, configure action, and primary Zen CTA inside a frosted popover anchored to the trigger pill.

- [ ] **Step 4: Remove the old bottom launch rail layout**

Delete the persistent bottom rail wrapper so the home shell has one Zen entry surface instead of two.

## Chunk 2: Verification

### Task 2: Prove the refactor still compiles and the helper coverage stays green

**Files:**
- Verify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts`

- [ ] **Step 1: Run shared tests**

Run: `pnpm --filter @repo/shared test -- src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts --run`

Expected: targeted helper suite passes with zero failures.

- [ ] **Step 2: Run web build**

Run: `pnpm --filter web build`

Expected: web app compiles successfully after the shell refactor.

- [ ] **Step 3: Run extension build**

Run: `pnpm --filter extension build`

Expected: extension app compiles successfully after the shell refactor.
