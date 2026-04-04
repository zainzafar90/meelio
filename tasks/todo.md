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

## Review

- Existing Meelio already contains many primitives: timer, blocker, soundscapes, tasks, notes, bookmarks, tab stash, greetings, quote, backgrounds, calendar UI, clock, and breathing.
- The gap is not raw feature count; the gap is product composition and daily workflow cohesion.
- First chunk should establish a canonical daily dashboard experience rather than adding more isolated utilities.
- The initial build target is: Today Dashboard + Daily Focus Plan + Unified Focus Session entrypoint.
- Phase 2 target is: Quick Capture + dashboard task actions + stronger actionability from the focus dashboard.
- Phase 2 foundation now adds a layered quick-capture slice, a shared quick-capture store, a dashboard capture bar, and inline dashboard task actions.
- Quick-captured tasks are intentionally pinned so the dashboard loop stays action-first and new work lands in focus immediately.
- Verification completed for the affected packages and app surfaces:
  - `pnpm --filter @repo/contracts test -- --run`
  - `pnpm --filter @repo/core test -- --run`
  - `pnpm --filter @repo/application test -- --run`
  - `pnpm --filter @repo/infrastructure test -- --run`
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
