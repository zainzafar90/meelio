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

# Timer Core Extraction And Extension Validation

- [x] Create a dedicated follow-up branch from blocker checkpoint `03826245`
- [x] Add failing unit tests for a pure `packages/timer-core` state machine and contracts
- [x] Extract timer contracts, defaults, and transition logic into `packages/timer-core`
- [x] Migrate extension background timer messaging to `@repo/timer-core`
- [x] Rebuild `apps/extension/src/stores/extension.timer.store.ts` on top of `@repo/timer-core` and an extension-local runtime adapter
- [x] Add a repo-level `validate:extension` command for extension boot, timer, and blocker smoke flows
- [x] Verify unit tests, extension tests, extension build, and extension validator

## Extraction Review

- Follow-up branch: `feat/timer-core-validation`
- Goal: remove extension timer/runtime dependence on shared UI-owned timer contracts without changing blocker behavior.
- Constraint: keep `packages/timer-core` pure and environment-agnostic so it can be reused by extension and web adapters.
- Validation goal: prove the extension boots, timer actions respond, blocker drawer loads, blocked redirects fire, and bypass returns to the original URL.
- Implemented `packages/timer-core` with pure timer contracts, defaults, snapshots, and transition helpers plus dedicated Vitest coverage.
- Replaced the extension’s `createTimerStore` dependency with a local Zustand store that uses `@repo/timer-core` for timer transitions while keeping extension runtime messaging local.
- Added a regression test preventing the MV3 background and extension timer store from drifting back to the shared root barrel.
- Added `pnpm validate:extension`, which now:
  - runs extension tests
  - builds the unpacked MV3 bundle
  - launches a fresh browser profile
  - validates timer start/pause/reset
  - validates blocker drawer bootstrap and permission request
  - adds and removes a custom blocked domain through the live UI
  - verifies blocked-page bypass leaves `blocked.html` and that the site no longer redirects after rule removal
  - accepts `MEELIO_BLOCK_TEST_DOMAIN` so the blocked-domain smoke target can be changed without editing the script
- Verification completed:
  - `pnpm --filter @repo/timer-core test -- --run`
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter extension build`
  - `pnpm validate:extension`

# Remaining Branch Blockers

- [x] Migrate the web/shared timer runtime fully onto `@repo/timer-core`
- [x] Extend `validate:extension` to prove `focus-only` blocking behavior
- [x] Wire the validator into CI
- [x] Re-run verification after the blocker-scope changes

## Blocker Review

- User clarified that web/shared timer migration, `focus-only` validation, and CI wiring are blockers for branch completion, not optional follow-ups.
- Resolved gaps:
  - `apps/web/src/stores/web.timer.store.ts` now owns a local web timer store built directly on `@repo/timer-core`
  - `packages/shared/src/stores/timer.store.ts` now delegates timer transitions to `@repo/timer-core`
  - `packages/shared/src/components/timer.tsx` now types the timer store against Zustand state instead of `ReturnType<typeof createTimerStore>`, so web and extension stores can diverge cleanly
  - `scripts/validate/extension.mjs` now proves `focus-only` gating by asserting the same blocked domain stays unblocked during a running break and redirects again during a running focus session
  - `.github/workflows/extension-validator.yml` now runs shared/web timer boundary checks, the web production build, and `pnpm validate:extension` in CI
- Verification completed after the blocker-scope changes:
  - `pnpm --filter @repo/timer-core test -- --run`
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter web test -- --run`
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `MEELIO_BLOCK_TEST_DOMAIN=zainzafar.net pnpm validate:extension`

# Site Blocker UI Alignment

- [x] Audit the current extension blocker sheet against existing Meelio sheet patterns
- [x] Align the blocker drawer structure, spacing, controls, and surfaces with Meelio design language
- [x] Verify the updated drawer with targeted extension checks

## UI Alignment Notes

- Current mismatch: the blocker sheet uses more standalone card treatments and a more “settings console” feel than the calmer, flatter Meelio sheets used by bookmarks, tab stash, and the legacy blocker surface.
- The redesign should preserve the current functionality while bringing the visual hierarchy, spacing rhythm, and control treatments back toward the existing Meelio drawer language.
- Implemented changes:
  - simplified the header language and brought the tabs into the same quieter drawer treatment used elsewhere in Meelio
  - replaced the heavier nested cards with flatter bordered sections and row-based controls
  - restyled the shared blocker preset rows so the category list and site items feel like Meelio content, not a separate tool embedded inside the sheet
  - removed the duplicate “Popular Sites” heading in the extension flow and made the curated list read as part of the same surface
  - redesigned `blocked.html` so the interruption page now reads like an expanded Meelio blocker surface instead of a separate glassy landing page
  - tuned `blocked.html` typography down from the overly heavy first pass and added restrained emerald/sky badge accents so the page feels lighter without drifting away from the Meelio palette
- Verification completed:
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `MEELIO_BLOCK_TEST_DOMAIN=zainzafar.net pnpm validate:extension`

# Timer Core Tsconfig Fix

- [x] Reproduce the `packages/timer-core/tsconfig.json` resolution issue
- [x] Replace the brittle workspace-package `extends` path with a direct monorepo-relative config path
- [x] Re-run targeted timer-core TypeScript verification

## Tsconfig Fix Review

- Root cause: `packages/timer-core/tsconfig.json` extended `@repo/typescript-config/base.json`, which resolves under the workspace toolchain but can fail in editor/static resolution paths that do not follow workspace package lookup the same way.
- Fix applied: `packages/timer-core/tsconfig.json` now extends `../typescript-config/base.json` directly, which keeps the package self-contained inside the monorepo and avoids package-resolution ambiguity for the config file itself.

# Blocker Permission Flow Review

- [x] Inspect extension manifest/WXT permission declarations for blocker enforcement
- [x] Trace runtime permission request and state sync behavior in the blocker UI/background
- [x] Summarize whether blocker permissions are optional, when they are requested, and whether anything should change

## Permission Flow Review

- Current manifest shape:
  - core extension permissions are declared in `apps/extension/wxt.config.ts`
  - all-sites access for blocker enforcement/tracking is declared as `optional_host_permissions`, not a startup host permission
  - the blocker also uses `declarativeNetRequestWithHostAccess`, so host access still depends on the optional all-sites grant
- Fix applied:
  - the actual `chrome.permissions.request` call now happens in the blocker drawer click handler
  - the background `blocker/request-host-access` command now only reconciles and persists permission state instead of trying to trigger the prompt itself
- Verification completed:
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter extension build`
  - `pnpm validate:extension`

# Permission Minimization

- [x] Audit every required extension permission against actual runtime usage
- [x] Add failing coverage for the new optional-permission behavior where practical
- [x] Move safe permissions behind explicit user intent without breaking blocker/timer flows
- [x] Re-run extension tests, build, and live validator after the manifest/runtime changes

## Permission Minimization Review

- Final permission split:
  - required: `storage`, `alarms`, `tabs`, `webNavigation`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`
  - optional: `notifications`, `tabGroups`, `bookmarks`
  - runtime user-intent grant: `optional_host_permissions` for `http://*/*` and `https://*/*`
- Runtime behavior changes:
  - the blocker request button now asks for all-sites host access from the page click path and then syncs state in the background
  - timer notifications now request permission only when the user enables notifications
- Validation evidence:
  - removing `tabs` broke URL visibility needed by the live blocker flow
  - removing `webNavigation` broke the exact-URL continue path on `blocked.html`
  - keeping `tabs` + `webNavigation` required while moving `notifications` optional preserved all blocker/timer flows
- Verification completed:
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter web test -- --run`
  - `pnpm --filter extension build`
  - `pnpm validate:extension`

# Background Error Investigation

- [x] Reproduce the reported `background.ts` error with a targeted diagnostic
- [x] Inspect the failing `background.ts` lines and surrounding permission/runtime code
- [x] Explain the root cause and apply a fix if the error is real

## Background Error Review

- Root cause: `apps/extension/src/entrypoints/background.ts` still referenced `hasAllSitesPermission()` in the `blocker/import` branch after the permission refactor renamed the shared permission check to `hasBlockerAccessPermission()`.
- Fix applied: the stale call in `background.ts` now uses `hasBlockerAccessPermission()`.
- Verification completed:
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter extension build`
  - `pnpm --filter extension exec tsc --noEmit 2>&1 | rg 'background.ts'`
- Note: a full `tsc --noEmit` for the extension still reports unrelated existing repo issues outside `background.ts`; the reported `background.ts` error itself is resolved.

# Project-wide Lint Scan

- [x] Run the root workspace lint command
- [x] Capture any failing packages/files
- [x] Summarize the project-wide lint state

## Lint Scan Review

- Root command run: `pnpm lint` from the workspace root (`turbo run lint`)

# Localization Audit And Fix

- [x] Audit blocker drawer, blocked page, shared preset UI, and timer surfaces for English-only copy
- [x] Add missing blocker and timer translation keys across all supported locales
- [x] Add locale-aware formatting and plain-DOM i18n helpers for `blocked.html`
- [x] Add locale completeness and hardcoded-copy boundary tests
- [x] Verify shared, web, and extension builds/tests after the localization pass

## Localization Review

- Branch-introduced localization debt is concentrated in the extension blocker drawer, `blocked.html`, and the shared site preset UI.
- Surfaced inherited localization debt includes timer controls, timer settings copy, and timer validation messages.
- This pass keeps the narrow `@repo/shared/i18n` boundary, adds non-React helpers for DOM-only entrypoints, and localizes blocker/timer user-facing copy across all supported locales.
- Added full blocker/timer locale coverage for `en`, `de`, `es`, `fr`, `pt`, `ru`, `ja`, `zh`, and `ar`, including the extension drawer, blocked page, preset labels, timer controls, timer settings, and validation messages.
- Added locale guardrails:
  - `packages/shared/src/i18n/localization-completeness.test.ts`
  - `packages/shared/src/i18n/localization-boundary.test.ts`
  - `apps/extension/src/tests/localization-boundary.test.ts`
- Verification completed:
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter extension test -- --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
- Result: failed
- Hard failure:
  - `@repo/timer-core#lint` exited with ESLint error: `No files matching the pattern "." were found.`
- Warnings surfaced before Turbo stopped:
  - `packages/ui/src/components/ui/badge.tsx:36` `react-refresh/only-export-components`
  - `packages/ui/src/components/ui/button.tsx:62` `react-refresh/only-export-components`
  - `packages/ui/src/components/ui/form.tsx:169` `react-refresh/only-export-components`
  - `packages/ui/src/components/ui/sidebar.tsx:117` `react-hooks/exhaustive-deps`
  - `packages/ui/src/components/ui/sidebar.tsx:764` `react-refresh/only-export-components`
- Because Turbo aborted on `@repo/timer-core`, this run should be treated as an incomplete workspace lint pass until the timer-core lint script/pattern is fixed and the scan is rerun.

# Lint Fix

- [x] Fix the `@repo/timer-core` lint script so root lint can traverse the workspace
- [x] Fix the `apps/extension` typed-lint config so `vitest.config.ts` is covered cleanly
- [x] Re-run `pnpm lint`
- [x] Summarize remaining warnings or failures after the root blockers are removed

## Extension Lint Boundary Review

- Root cause: `apps/extension/.eslintrc.js` used typed linting (`parserOptions.project`) against `apps/extension/tsconfig.json`, but `vitest.config.ts` was linted by the package script without being included in that TSConfig.
- Secondary config issues: the extension ESLint config did not load TypeScript recommended rules, and it did not declare the browser extension environment (`chrome`, `window`, `document`), which produced a large amount of misleading lint noise.
- Fix applied: added `apps/extension/tsconfig.eslint.json` for typed lint coverage of config files, switched the extension ESLint config to a browser/React-internal base with TypeScript and React Hooks rules, and declared the `chrome` global explicitly.
- Verification completed:
  - `pnpm --filter extension lint`
  - `pnpm lint`
- Current status:
  - `apps/extension` lint now exits successfully with warnings only.
  - Workspace lint now exits successfully.
  - Remaining warning-only frontier is mostly pre-existing lint noise in `packages/shared`, plus a smaller set in `apps/extension` (`react-refresh`, `react-hooks/exhaustive-deps`, `turbo/no-undeclared-env-vars`, and `media.utils.ts` cleanup).

# Timer Core Lint Cleanup

- [x] Replace the explicit timer-core lint file globs with a cleaner package-wide ESLint command
- [x] Re-run targeted timer-core lint to confirm the cleaner script works
