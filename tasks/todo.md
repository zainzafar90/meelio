# Focus Dashboard Roadmap Todo

- [x] Inventory current feature surface in `apps/*` and `packages/shared`
- [x] Decide the first implementation tranche for the focus dashboard
- [x] Write a product strategy spec for dashboard feature parity and design direction
- [x] Write an implementation plan with phased chunks
- [x] Review the stored plan with the user
- [x] Convert the approved first chunk into detailed implementation tasks
- [x] Implement chunk 1 foundation in `contracts`, `core`, `application`, and `infrastructure`
- [x] Compose the first focus dashboard shell in web and extension
- [x] Verify behavior and architecture boundaries
- [x] Create Phase 2 branch for quick capture work
- [x] Define Phase 2 scope: quick capture + dashboard task actions
- [x] Write Phase 2 spec and implementation plan
- [x] Implement Phase 2 quick capture foundation
- [x] Verify Phase 2 behavior and boundaries
- [x] Define Phase 3 scope: smart dashboard actions
- [x] Write Phase 3 spec and implementation plan
- [x] Implement Phase 3 smart dashboard actions
- [x] Verify Phase 3 behavior and boundaries
- [x] Define Phase 4 scope: desktop home and focus shell
- [x] Write Phase 4 spec and implementation plan
- [ ] Implement Phase 4 desktop home and focus shell
- [x] Repair Phase 4 shell wiring after UI rewrite
- [x] Unify home and focus shell typography/container treatment
- [x] Rebalance timer surface to match the shell
- [ ] Strengthen shell pill visibility in home and focus modes
- [ ] Run browser-led polish pass across home and focus modes
- [x] Define Phase 5 scope: motion and mode transitions
- [x] Write Phase 5 spec and implementation plan
- [x] Implement Phase 5 motion and mode transitions
- [x] Verify Phase 5 behavior and boundaries
- [x] Define Phase 6 scope: shell presence and responsive calibration
- [x] Write Phase 6 spec and implementation plan
- [x] Implement Phase 6 shell presence and responsive calibration
- [x] Tighten Phase 6 responsive spacing for home, focus, quote, and dock
- [x] Verify Phase 6 behavior and boundaries
- [x] Define Phase 7 scope: focus workflow intelligence
- [x] Write Phase 7 spec and implementation plan
- [ ] Implement Phase 7 focus workflow intelligence
- [ ] Verify Phase 7 behavior and boundaries
- [x] Verify Phase 4 behavior and boundaries

## Review

- Existing Meelio already contains many primitives: timer, blocker, soundscapes, tasks, notes, bookmarks, tab stash, greetings, quote, backgrounds, calendar UI, clock, and breathing.
- The gap is not raw feature count; the gap is product composition and daily workflow cohesion.
- First chunk should establish a canonical daily dashboard experience rather than adding more isolated utilities.
- The initial build target is: Today Dashboard + Daily Focus Plan + Unified Focus Session entrypoint.
- Phase 2 target is: Quick Capture + dashboard task actions + stronger actionability from the focus dashboard.
- Phase 2 foundation now adds a layered quick-capture slice, a shared quick-capture store, a dashboard capture bar, and inline dashboard task actions.
- Quick-captured tasks are intentionally pinned so the dashboard loop stays action-first and new work lands in focus immediately.
- Phase 3 target is: smarter dashboard actions driven by the pinned task and the time window before the next event.
- Phase 3 now treats the pinned task as the active focus task, lets the CTA reference that task directly, and adds agenda-window guidance to the hero and agenda card.
- Phase 4 target is: replace the card-heavy home layout with a desktop-style ambient shell, a persistent dock, and a dedicated focus mode shell.
- The latest Phase 4 pass repaired broken CTA wiring after a manual UI rewrite, simplified the ambient metadata treatment, and pushed the timer toward the same darker visual language as the shell.
- Phase 5 target is: make home and focus feel like two states of one environment through restrained transitions instead of abrupt mode swaps.
- Phase 6 target is: calibrate shell presence across wallpapers and screen sizes without reintroducing harsh chrome.
- Phase 7 now explicitly distinguishes “choose focus task” from “start focus” by tying the active focus task to the pinned task instead of the first incomplete task.
- Phase 7.2 now tracks the session focus task separately from the currently pinned task, so the CTA can distinguish resume from switch.
- Completing a pinned focus task now promotes the next most recently updated incomplete task into focus automatically.
- Verification completed for the affected packages and app surfaces:
  - `pnpm --filter @repo/contracts test -- --run`
  - `pnpm --filter @repo/core test -- --run`
  - `pnpm --filter @repo/application test -- --run`
  - `pnpm --filter @repo/infrastructure test -- --run`
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`

## Pill Wiring Bug

- [x] Confirm how top calendar and todo pills derive their data
- [x] Add regression coverage for pill-facing task and calendar values
- [x] Wire pill values to live calendar event summaries and task counts
- [x] Verify targeted test suites for the affected focus-dashboard logic

## Review

- Top shell pills were using focus-dashboard snapshot fields that are intentionally narrow or generic.
- The task pills were not based on the full task store, so completed and queued counts drifted from actual todos.
- The calendar pill was showing an agenda status label instead of the actual event summary, which made it feel disconnected even when calendar data existed.
- Verification:
  - `pnpm --filter @repo/shared test -- src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts`
  - `pnpm --filter @repo/shared test -- --run`

## Task List Focus Labeling

- [x] Inspect the task list row action that users read as “start”
- [x] Replace the icon-only focus affordance with explicit copy
- [x] Hide the focus affordance for completed tasks
- [x] Verify targeted shared tests for the task-list change

## Review

- The task list was using a bare star icon for `togglePinTask`, which forced users to guess that starring a task meant “set this as the current focus task.”
- The row action now uses explicit copy: `Focus` for selectable tasks and `Focused` for the current one.
- Completed tasks no longer advertise a focus action, which keeps the sheet aligned with the dashboard’s active-focus model.
- Verification:
  - `pnpm --filter @repo/shared test -- src/components/core/task-list/components/task-list.helpers.test.ts`
  - `pnpm --filter @repo/shared test -- --run`

## Startup Focus Hydration

- [x] Trace why pinned tasks are missing from the dashboard on extension open
- [x] Move task-store initialization out of the task sheet and into dashboard startup
- [x] Verify shared tests after the startup hydration change

## Review

- The dashboard CTA was reading an empty task store on startup because tasks were only initialized when the task sheet opened.
- Opening the sheet populated the store, which is why the pinned task only affected the CTA after that interaction.
- The focus dashboard now bootstraps the task store as soon as the user is available, so pinned tasks can influence `Start Focusing` immediately on load.
- Verification:
  - `pnpm --filter @repo/shared test -- --run`

## Startup CTA Loading State

- [x] Identify the transient incorrect CTA shown during task hydration
- [x] Add a pending state so startup shows a neutral animated button instead of the wrong action
- [x] Verify shared tests after the CTA loading-state change

## Review

- After moving task initialization to dashboard startup, the UI still rendered one frame of the pre-hydration CTA before the task store finished loading.
- The home shell now treats task hydration as a real pending state and shows a disabled animated `Loading focus...` CTA until tasks are ready.
- The dashboard also avoids writing an empty daily plan back into the focus store during that pending window, which removes the visual flash instead of merely masking it.
- Verification:
  - `pnpm --filter @repo/shared test -- --run`

## Focus Entry Redesign

- [x] Remove the dashboard hero CTA and ambient deep-work prompt
- [x] Move focus entry into the dock as a ritual-style control
- [x] Add a lightweight dock chooser for unpinned tasks with the full task sheet as fallback
- [x] Verify shared tests after the dock-driven focus flow changes

## Review

- The old home shell split focus entry between a large center CTA and the dock, which made the product feel like two competing focus surfaces.
- The dashboard is now calmer and more ambient, with task presence shown as soft chips instead of a central command button.
- The dock now owns focus entry through a more playful ritual control, and when no task is pinned it opens a compact chooser instead of throwing the user straight into the full task sheet.
- Verification:
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
