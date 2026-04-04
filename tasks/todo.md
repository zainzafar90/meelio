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

## Review

- Existing Meelio already contains many primitives: timer, blocker, soundscapes, tasks, notes, bookmarks, tab stash, greetings, quote, backgrounds, calendar UI, clock, and breathing.
- The gap is not raw feature count; the gap is product composition and daily workflow cohesion.
- First chunk should establish a canonical daily dashboard experience rather than adding more isolated utilities.
- The initial build target is: Today Dashboard + Daily Focus Plan + Unified Focus Session entrypoint.
- Verification completed for the affected packages and app surfaces:
  - `pnpm --filter @repo/contracts test -- --run`
  - `pnpm --filter @repo/core test -- --run`
  - `pnpm --filter @repo/application test -- --run`
  - `pnpm --filter @repo/infrastructure test -- --run`
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
