# Desktop Home And Focus Shell Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current home composition with a desktop-style ambient shell, restore the persistent dock, and introduce a real immersive focus mode.

**Architecture:** Keep the existing layered focus/task/capture logic, but redesign the shared layout shell around mode-based composition. Use Home and Focus as first-class shells rather than continuing to stack cards on one surface.

**Tech Stack:** React, TypeScript, Zustand, existing `@repo/*` layered packages, web + extension app surfaces

---

### Task 1: Build Desktop Home Shell

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx`
- Modify: related shared layout/dock components as needed

- [ ] Step 1: Create a viewport-locked home shell with no main scroll
- [ ] Step 2: Center the clock, greeting/mantra, and primary CTA
- [ ] Step 3: Move secondary information to the edges
- [ ] Step 4: Remove persistent card-stack behavior from the default home view

### Task 2: Restore Persistent Dock

**Files:**
- Modify: shared dock composition files used by web/extension home surfaces
- Modify: home shell to reserve dock space

- [ ] Step 1: Keep the bottom dock visible in the home shell
- [ ] Step 2: Ensure content never overlaps or pushes it off-screen
- [ ] Step 3: Treat the dock as the main launcher for tools/panels

### Task 3: Introduce Focus Mode Shell

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx`
- Modify: timer presentation components if needed

- [ ] Step 1: Add a real focus mode state to the shell
- [ ] Step 2: Make the timer the dominant center in focus mode
- [ ] Step 3: Surface the active focus task below the timer
- [ ] Step 4: Keep controls minimal and peripheral

### Task 4: Demote Planning Tools Into Panels

**Files:**
- Modify: shared shell and panel-trigger composition
- Modify: dock/home tool entry points as needed

- [ ] Step 1: Remove always-visible plan/task stacks from default home
- [ ] Step 2: Expose plan/tasks/notes/blocker through dock or panel actions
- [ ] Step 3: Keep quick capture and planning accessible without making home heavy

### Task 5: Adaptive Layout And Validation

**Files:**
- Modify: relevant tests only

- [ ] Step 1: Ensure no main home/dashboard scrollbar remains
- [ ] Step 2: Verify the shell adapts cleanly across screen sizes
- [ ] Step 3: Run affected package/shared tests
- [ ] Step 4: Run web and extension builds
- [ ] Step 5: Review final structure against `docs/architecture/layered-architecture.md`
