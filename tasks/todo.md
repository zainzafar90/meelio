# Meelio Robust Site Blocker + Tracking V1

- [x] Review existing blocker-related code in `apps/extension` and `packages/shared`
- [x] Inspect reference implementations in `meelio-momentum-extension` and `time-tracker-4-browser`
- [x] Lock the v1 architecture and product scope with the user
- [x] Add failing unit tests for blocker contracts, host matching, DNR rule generation, bypass logic, retention, and export/import
- [x] Implement extension-owned blocker types, storage schema, serializers, and pure service helpers
- [x] Implement a typed extension message dispatcher for blocker and tracking commands
- [x] Rebuild `apps/extension/src/entrypoints/background.ts` as the blocker source of truth with DNR syncing, bypass lifecycle, tracking aggregation, and timer-stage gating
- [x] Replace `apps/extension/src/entrypoints/content.tsx` with tracker-only session reporting
- [x] Add a dedicated blocked-page entrypoint with back, timed bypass, exact-URL continue, and settings actions
- [x] Update `apps/extension/wxt.config.ts` and related extension config for DNR, web navigation, tabs, and blocked-page access
- [x] Replace the extension site blocker drawer wiring with extension-owned `Sites` and `Activity` tabs over the new background state
- [x] Verify blocker flows with targeted tests and extension build checks
- [x] Document review findings, residual risks, and follow-up work

## Review

- Added pure blocker-core tests for activation gating, per-site bypass, DNR rule generation, retention cleanup, and export/import.
- Added blocker-state tests for rule mutation behavior and 7-day activity aggregation.
- Added a regression test proving the content script only sends tracking commands and does not write blocker state directly.
- Verified `pnpm --filter extension test -- --run` passes.
- Verified `pnpm --filter @repo/shared test -- --run` passes after the timer message contract update.
- Verified `pnpm --filter extension build` succeeds for Chrome MV3 and outputs `blocked.html`, `background.js`, and the tracker content script.
- Residual gaps: no browser-driven E2E suite yet, no Firefox/Safari fallback state yet, and no UI test coverage for the drawer interactions.

# Drawer Interactivity Debug

- [x] Reproduce the inert drawer controls in a live extension session
- [x] Inspect the rendered drawer DOM and event path for blocked pointer or controlled-state issues
- [x] Trace failed UI actions into the extension runtime/background and fix the root cause
- [ ] Re-verify drawer interactions manually in the browser and with targeted automated checks

## Drawer Interactivity Review

- Root cause candidate: the DNR rule builder was still encoding `?pattern=...` into `redirect.extensionPath`, which violated the agreed redirect design and could poison `refreshBlockerState()` because rule sync runs on bootstrap and every UI mutation.
- Fix applied: redirect rules now use a plain `/blocked.html` extension path, and the blocked page fetches `{ pattern, originalUrl }` from the background tab map through a dedicated runtime command.
- Resilience improvement: the extension drawer now surfaces bootstrap/mutation errors inline instead of failing silently when background commands reject.
- Verified `pnpm --filter extension test -- --run` passes.
- Verified `pnpm --filter extension build` succeeds after the redirect/context refactor.
- Remaining gap: I have not yet completed a real browser click-through against the actual loaded extension drawer; my direct Chrome automation path confirmed runtime/profile state, but Chrome did not expose the unpacked extension cleanly through that custom launch path.

# Drawer Bootstrap Hang Debug

- [x] Repair the broken `ensureReconciledState()` path in `background.ts`
- [x] Make `blocker/get-state` fail fast instead of leaving the drawer in permanent bootstrap
- [x] Re-run targeted blocker runtime tests and extension build
- [x] Verify the live drawer no longer shows `Syncing blocker state...` and that controls mutate real state

## Drawer Bootstrap Hang Review

- User-reported symptom remains: drawer opens, but controls are inert and footer stays on `Syncing blocker state...`.
- Root-cause hypothesis: `blocker/get-state` is hanging during background reconciliation, likely because bootstrap is waiting on side effects or throwing before responding.
- Guardrail for this pass: do not mark the issue fixed until the actual loaded extension drawer is interacted with successfully.
- Confirmed root cause: `apps/extension/src/entrypoints/background.ts` imported `TimerStage` from the `@repo/shared` root barrel, which pulled browser-only shared modules into the MV3 worker bundle. The compiled `background.js` ballooned to megabytes and the live drawer timed out on `blocker/get-state` because the worker was not bootstrapping cleanly.
- Final fix: the background now imports timer types directly from `packages/shared/src/types/timer.types`, the background bootstrap path no longer blocks on side effects, and the command helper fails fast instead of leaving the UI in permanent bootstrap.
- Verified in a live Edge MV3 session with the unpacked extension:
  - The site blocker drawer opens without the `Extension command timed out: blocker/get-state` banner.
  - Adding `example.com` through the drawer succeeds.
  - Opening `https://example.com` redirects to the blocked page with `Back`, `Bypass 15 min`, `Bypass 60 min`, and `Open Meelio settings`.

# Timer Core And Validation Design

- [ ] Map the long-term `timer-core` extraction boundaries and migration complexity
- [ ] Define the validation runner scope across web, extension, and shared checks
- [ ] Compare implementation approaches and recommend one
- [ ] Get user approval before implementing the validator or refactor

## Design Notes

- Existing repo state: `apps/web` already has Playwright-based E2E, but `apps/extension` does not have an extension-aware browser validation runner.
- Current architectural risk: the extension background is protected from the shared root barrel now, but timer messaging and timer store logic are still partially coupled to shared code.
- Desired outcome: a long-term design that makes timer behavior portable and a validation harness that can prove app behavior without manual browser poking.
