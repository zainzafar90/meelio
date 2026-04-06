# Zen Mode Focus Orchestration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an explicit Zen Mode session that orchestrates timer, tasks, soundscapes, site blocker, and optional tab stashing from the focus dashboard.

**Architecture:** Add a shared Zen Mode orchestration layer that owns session lifecycle and restore behavior while leaving timer, task, soundscape, dock, blocker, and tab-stash logic in their existing owners. Use extension-only adapters for browser capabilities and keep the web implementation honest with graceful partial behavior.

**Tech Stack:** React, Zustand, layered `contracts/core/application/shared` packages, extension background commands, i18next, Vitest.

---

### Task 1: Store Scope And UX Contract

**Files:**
- Modify: `tasks/todo.md`
- Create: `docs/superpowers/specs/2026-04-07-zen-mode-focus-orchestration-design.md`
- Create: `docs/superpowers/plans/2026-04-07-zen-mode-focus-orchestration.md`

- [ ] Save the approved Zen Mode design and plan documents.
- [ ] Keep the lifecycle assumption explicit in the docs: Zen Mode persists until `End Zen`.
- [ ] Record extension-only boundaries so implementation does not fake browser capabilities on web.

### Task 2: Add Persistent Zen Mode Settings

**Files:**
- Modify: `packages/shared/src/stores/app.store.ts`
- Modify: `packages/shared/src/components/core/settings/tabs/general-settings.tsx`
- Modify: `packages/shared/src/i18n/locales/en/translation.json`
- Modify: `packages/shared/src/i18n/locales/{de,es,fr,pt,ru,ja,zh,ar}/translation.json`
- Modify: `packages/shared/src/i18n/localization-completeness.test.ts`

- [ ] Add a `zenMode` settings shape to app-level persisted state.
- [ ] Seed defaults: timer `true`, soundscapes `true`, pinned-task sync `true`, site blocker `true`, tab stash `false`.
- [ ] Add a focused Zen Mode settings section in General Settings.
- [ ] Add localized copy for labels, descriptions, and platform caveats.
- [ ] Extend localization completeness coverage for the new settings block.

### Task 3: Introduce Shared Zen Mode Session Orchestration

**Files:**
- Create: `packages/shared/src/stores/zen-mode.store.ts`
- Create: `packages/shared/src/stores/zen-mode.store.test.ts`
- Modify: `packages/shared/src/stores/dock.store.ts`
- Modify: `packages/shared/src/stores/soundscapes.store.ts`
- Modify: `packages/shared/src/stores/task.store.ts`
- Modify: `packages/shared/src/stores/focus-dashboard.store.ts`

- [ ] Model explicit Zen session state:
  - inactive
  - starting
  - active
  - ending
- [ ] Snapshot pre-session shell and soundscape state on entry.
- [ ] Store enough restoration data to return the user to the pre-Zen baseline on exit.
- [ ] Keep orchestration in one store/service rather than spreading cross-store mutations through the dashboard UI.
- [ ] Add tests for start, exit, and restoration behavior.

### Task 4: Extract Callable Browser Capability Adapters

**Files:**
- Create: `packages/shared/src/components/core/tab-stash/services/tab-stash.service.ts`
- Create: `packages/shared/src/components/core/tab-stash/services/tab-stash.service.test.ts`
- Modify: `packages/shared/src/components/core/tab-stash/hooks/use-tab-stash.ts`
- Modify: `packages/shared/src/stores/tab-stash.store.ts`
- Modify: `packages/platform/src/extension/site-blocker/runtime.ts`
- Modify: `apps/extension/src/entrypoints/background.ts`

- [ ] Extract tab-stashing execution from the React hook into a callable service that can be reused by Zen Mode.
- [ ] Preserve current tab-stash sheet behavior by routing the hook through the new service.
- [ ] Define the extension adapter Zen Mode will call for blocker timer-state sync and tab-stash execution.
- [ ] Keep all browser-only behavior behind extension-only seams.

### Task 5: Build Start/Stop Zen Mode Actions

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx`
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.helpers.ts`
- Create: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.zen-mode.test.tsx`
- Modify: `apps/extension/src/newtab.tsx`
- Modify: `apps/web/src/routes/home/home.tsx`

- [ ] Replace the current focus-entry interaction with explicit Zen Mode entry/exit actions.
- [ ] Show module readiness before entry:
  - timer
  - task
  - soundscapes
  - blocker
  - tabs
- [ ] On Zen start:
  - initialize tasks
  - anchor to pinned task when enabled
  - start timer when enabled
  - trigger soundscapes when enabled
  - activate blocker focus behavior when enabled
  - stash tabs when enabled and permitted
- [ ] On Zen end:
  - restore soundscape and shell state
  - leave stashed tabs recoverable
  - release blocker back to non-session baseline
- [ ] Keep web behavior graceful when extension-only capabilities are unavailable.

### Task 6: Refine The Active Zen Shell

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx`
- Create: `packages/shared/src/components/core/focus-dashboard/components/zen-mode-status-row.tsx`
- Create: `packages/shared/src/components/core/focus-dashboard/components/zen-mode-config-trigger.tsx`
- Modify: `packages/shared/src/i18n/locales/en/translation.json`
- Modify: `packages/shared/src/i18n/locales/{de,es,fr,pt,ru,ja,zh,ar}/translation.json`

- [ ] Present 4-5 core interactions only in active Zen state.
- [ ] Keep the shell visually calmer than the current home state.
- [ ] Add compact configuration access without throwing the user into full settings.
- [ ] Surface permission-needed and unavailable states without breaking the flow.

### Task 7: Wire Soundscapes And Timer Event Interop Cleanly

**Files:**
- Modify: `packages/shared/src/stores/soundscapes-timer-integration.ts`
- Modify: `packages/application/src/timer/create-timer-store.ts`
- Modify: `packages/application/src/timer/create-timer-store.test.ts`

- [ ] Reuse existing timer-to-soundscapes event handling where it already matches Zen Mode behavior.
- [ ] Prevent duplicated or conflicting soundscape side effects between timer events and Zen session orchestration.
- [ ] Verify focus, break, pause, and exit behavior stay coherent.

### Task 8: Verification

**Files:**
- Test: `packages/shared/src/stores/zen-mode.store.test.ts`
- Test: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.zen-mode.test.tsx`
- Test: `packages/shared/src/components/core/tab-stash/services/tab-stash.service.test.ts`
- Test: `packages/application/src/timer/create-timer-store.test.ts`
- Test: `apps/extension/src/tests/*zen*`

- [ ] Run `pnpm --filter @repo/contracts test -- --run`
- [ ] Run `pnpm --filter @repo/core test -- --run`
- [ ] Run `pnpm --filter @repo/application test -- --run`
- [ ] Run `pnpm --filter @repo/shared test -- --run`
- [ ] Run `pnpm --filter web build`
- [ ] Run `pnpm --filter extension build`
