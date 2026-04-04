# Layered Architecture Assessment

## Plan
- [completed] Inspect the current monorepo structure and identify where UI, state, data access, and platform logic currently live.
- [completed] Compare the current structure against the proposed layers: UI, command/event contract, application, core, provider, infrastructure, and platform.
- [completed] Define a target package and layer split that fits the existing pnpm/turbo workspace instead of forcing a rewrite.
- [completed] Identify the highest-risk coupling points that must be untangled first.
- [completed] Write a phased migration plan with package boundaries, dependency rules, and rollout order.
- [completed] Create the first layer packages for a real vertical slice.
- [completed] Extract the extension site-blocker contracts, core logic, application logic, and platform adapters into the new packages.
- [completed] Keep extension behavior stable through compatibility shims while the rest of the repo remains unmigrated.
- [completed] Verify the extracted slice with package tests, extension tests, and an extension production build.

## Review
- Added the first layer packages: `packages/contracts`, `packages/core`, `packages/application`, `packages/platform`, and `packages/infrastructure`.
- Extracted the extension site-blocker slice so the source of truth now lives in the new packages.
- `packages/contracts/src/site-blocker` owns extension blocker command and response types.
- `packages/core/src/site-blocker` owns blocker host normalization and pure blocking rules.
- `packages/application/src/site-blocker` owns blocker state transitions and activity projection.
- `packages/platform/src/extension/site-blocker` owns extension runtime transport and blocker permission adapters.
- Replaced the old extension-local blocker service files with compatibility shims that re-export from the new package sources.
- Kept notification permission helpers local to `apps/extension` because that file also serves timer runtime compatibility and was outside the blocker split.
- Verification:
- `pnpm test` in `packages/core`
- `pnpm test` in `packages/application`
- `pnpm test -- src/features/site-blocker/services/blocker-core.test.ts src/features/site-blocker/services/blocker-state.test.ts` in `apps/extension`
- `pnpm build --filter=extension` in repo root

## Timer Validation Expansion

### Plan
- [completed] Rename timer validation commands into the `validate:extension:*` structure so focused extension checks read consistently.
- [completed] Expand the timer validation beyond start/pause/reset to cover settings, stage switching, persistence, stats, and cleanup.
- [completed] Verify the new timer validator directly and confirm the full extension validator still points at the broader scenario.

### Success Criteria
- `pnpm validate:extension:timer` exercises a meaningful timer flow instead of a shallow smoke test.
- The timer validator restores defaults or clears persisted timer state before exiting.
- `pnpm validate:extension` remains the broad full-flow validator.

### Review
- Added `validate:extension:timer` and `validate:extension:blocker` command entrypoints so extension validation now has focused scenario names alongside the full run.
- Expanded the timer validation to cover settings edits, persisted durations after reload, stage controls, skip behavior, stats dialog rendering, and cleanup back to default timer storage.
- Updated the shared validation logger so each command prints its own validation prefix instead of always logging as `validate:extension`.
- Verification:
- `pnpm validate:extension:timer`
- `pnpm validate:extension`

## Timer Validation Completion Pass

### Plan
- [completed] Inspect the timer runtime and store behavior for notification settings, auto-start, completion, and restore flows.
- [completed] Add failing coverage for the next timer use cases before extending the validator.
- [completed] Expand `validate:extension:timer` to cover additional meaningful timer behaviors without making cleanup brittle.
- [completed] Re-run focused and broad extension validation after the expansion.

### Success Criteria
- The timer validator covers more than the happy path and exercises real timer state transitions that were previously untested.
- Newly added checks leave timer storage in a clean default state at the end of the run.
- `pnpm validate:extension:timer` and `pnpm validate:extension` both pass after the expansion.

### Review
- Added timer validator coverage tests in [apps/extension/src/tests/validator-timer-coverage.test.ts](/Users/zainzafar/projects/meelio/meelio/apps/extension/src/tests/validator-timer-coverage.test.ts) so the focused timer scenario now has explicit regression expectations.
- Expanded [scripts/validate/scenarios/timer-flow.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/scenarios/timer-flow.mjs) to cover:
- settings persistence for notifications, sounds, soundscapes, and auto-start
- restoring an in-progress timer after reload
- real stage completion with auto-start disabled
- real stage completion with auto-start enabled
- cleanup back to default persisted timer state
- Added timer persistence and switch helpers to [scripts/validate/lib/page-actions.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/lib/page-actions.mjs) so the validator can drive these flows without brittle ad-hoc DOM code.
- Verification:
- `pnpm --filter extension test -- src/tests/validator-timer-coverage.test.ts`
- `pnpm --filter extension test -- --run`
- `pnpm validate:extension:timer`
- `pnpm validate:extension`

## Validation Script Audit

### Plan
- [completed] Inventory `scripts/validate` and trace which files are actually used by current validator commands and tests.
- [completed] Remove or simplify validation helpers and entrypoints that are no longer relevant.
- [completed] Re-run the active validators after cleanup so the remaining script set is proven in use.

### Success Criteria
- `scripts/validate` contains only files that are used by the current extension validation flows or their supporting tests.
- The purpose of retained helpers is clear and there are no misleading redundant entrypoints.
- The active validation commands still pass after cleanup.

### Review
- Kept [scripts/validate/lib/validation-copy.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/lib/validation-copy.mjs) because it is actively used by the validation scenarios and page-action helpers to resolve English translation keys into stable selector text instead of hardcoding UI copy.
- Removed the orphaned legacy entrypoint [scripts/validate/timer.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/timer.mjs), which was no longer referenced by any package script, test, or workflow.
- Updated [scripts/validate/lib/temp-artifacts.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/lib/temp-artifacts.mjs) so its warning prefix matches the active validator name instead of always logging as `validate:extension`.
- Verification:
- `rg -n 'scripts/validate/timer\\.mjs|validate:timer' .`
- `pnpm --filter extension test -- src/tests/validator-timer-coverage.test.ts`
- `pnpm validate:extension:timer`

## Validation Naming Cleanup

### Plan
- [completed] Rename the validator label helper to a clearer file and function name.
- [completed] Update validator scripts and tests to use the new helper name consistently.
- [completed] Re-run focused verification after the rename.

### Success Criteria
- The old `validation-copy` name no longer appears in active validator code.
- The new helper name makes it clear the file resolves validator-facing UI labels.
- The focused validator and related tests still pass.

### Review
- Renamed [scripts/validate/lib/validation-copy.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/lib/validation-copy.mjs) to [scripts/validate/lib/validation-labels.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/lib/validation-labels.mjs).
- Renamed the helper API from `getValidationCopy(...)` to `getValidationLabel(...)` across the active validator scenarios, page actions, and localization tests.
- Verification:
- `rg -n 'validation-copy|getValidationCopy' scripts/validate apps/extension/src/tests`
- `pnpm --filter extension test -- src/tests/validator-localization.test.ts src/tests/validator-timer-coverage.test.ts`
- `pnpm validate:extension:timer`

## Scenario Naming Cleanup

### Plan
- [completed] Rename validation scenarios to the host+feature pattern: `extension-timer-flow` and `extension-blocker-flow`.
- [completed] Update validator entrypoints and tests to reference the renamed scenarios.
- [completed] Re-run focused verification after the rename.

### Success Criteria
- Scenario filenames use a consistent host+feature naming pattern.
- No active validator code or tests reference `extension-flow.mjs` or `timer-flow.mjs`.
- Focused validator checks still pass after the rename.

### Review
- Renamed [scripts/validate/scenarios/timer-flow.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/scenarios/timer-flow.mjs) to [scripts/validate/scenarios/extension-timer-flow.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/scenarios/extension-timer-flow.mjs).
- Renamed [scripts/validate/scenarios/extension-flow.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/scenarios/extension-flow.mjs) to [scripts/validate/scenarios/extension-blocker-flow.mjs](/Users/zainzafar/projects/meelio/meelio/scripts/validate/scenarios/extension-blocker-flow.mjs).
- Updated validator entrypoints and extension validator tests to reference the new scenario names.
- Verification:
- `pnpm --filter extension test -- src/tests/validator-localization.test.ts src/tests/validator-focus-mode.test.ts src/tests/validator-timer-coverage.test.ts`
- `pnpm validate:extension:timer`

## Timer Layer Alignment

### Plan
- [completed] Inspect `packages/timer-core` exports and current timer imports across the repo.
- [completed] Align timer contracts/core with the newer layered package structure while keeping compatibility for existing imports.
- [completed] Verify the refactor with targeted tests, builds, and validator runs.

### Success Criteria
- Timer contracts and core logic are represented consistently with the newer layered packages.
- Existing consumers do not break during the migration.
- The focused timer validation and relevant tests still pass after the alignment.

### Review
- Added timer contracts to [packages/contracts/src/timer/contracts.ts](/Users/zainzafar/projects/meelio/meelio/packages/contracts/src/timer/contracts.ts) with a minimal guard test at [packages/contracts/src/timer/contracts.test.ts](/Users/zainzafar/projects/meelio/meelio/packages/contracts/src/timer/contracts.test.ts).
- Added timer core logic to [packages/core/src/timer/timer.machine.ts](/Users/zainzafar/projects/meelio/meelio/packages/core/src/timer/timer.machine.ts) and [packages/core/src/timer/timer.defaults.ts](/Users/zainzafar/projects/meelio/meelio/packages/core/src/timer/timer.defaults.ts), plus coverage in [packages/core/src/timer/timer.machine.test.ts](/Users/zainzafar/projects/meelio/meelio/packages/core/src/timer/timer.machine.test.ts).
- Turned [packages/timer-core/src/timer.contract.ts](/Users/zainzafar/projects/meelio/meelio/packages/timer-core/src/timer.contract.ts), [packages/timer-core/src/timer.defaults.ts](/Users/zainzafar/projects/meelio/meelio/packages/timer-core/src/timer.defaults.ts), and [packages/timer-core/src/timer.machine.ts](/Users/zainzafar/projects/meelio/meelio/packages/timer-core/src/timer.machine.ts) into compatibility re-exports so older consumers can keep working during migration.
- Updated the newer layered timer code to use the new homes:
- [packages/application/src/timer/create-timer-store.ts](/Users/zainzafar/projects/meelio/meelio/packages/application/src/timer/create-timer-store.ts)
- [packages/platform/src/web/timer/runtime.ts](/Users/zainzafar/projects/meelio/meelio/packages/platform/src/web/timer/runtime.ts)
- [packages/platform/src/extension/timer/runtime.ts](/Users/zainzafar/projects/meelio/meelio/packages/platform/src/extension/timer/runtime.ts)
- [packages/infrastructure/src/timer/index.ts](/Users/zainzafar/projects/meelio/meelio/packages/infrastructure/src/timer/index.ts)
- Verification:
- `pnpm install`
- `pnpm --filter @repo/contracts test`
- `pnpm --filter @repo/core test`
- `pnpm --filter @repo/application test`
- `pnpm --filter web test -- src/tests/timer-boundary.test.ts`
- `pnpm --filter web build`
- `pnpm validate:extension:timer`

## Timer Core Consumer Cleanup

### Plan
- [completed] Locate the remaining `@repo/timer-core` imports and classify whether they should depend on timer contracts or timer core.
- [completed] Update the remaining consumers to the new timer package paths.
- [completed] Re-run targeted verification so the compatibility shim is no longer needed for active consumers.

### Success Criteria
- Active timer consumers no longer depend on `@repo/timer-core` unless intentionally left as temporary compatibility shims.
- Shared, web, and extension timer code reference `@repo/contracts/timer` and `@repo/core/timer` directly where appropriate.
- Focused timer validation and relevant boundary tests still pass after the cleanup.

### Review
- Updated the remaining active timer consumers to the new timer packages:
- [packages/shared/src/types/timer.types.ts](/Users/zainzafar/projects/meelio/meelio/packages/shared/src/types/timer.types.ts)
- [packages/shared/src/stores/timer.store.ts](/Users/zainzafar/projects/meelio/meelio/packages/shared/src/stores/timer.store.ts)
- [apps/extension/src/entrypoints/background.ts](/Users/zainzafar/projects/meelio/meelio/apps/extension/src/entrypoints/background.ts)
- Updated the tests that pinned the old shim path:
- [packages/shared/src/stores/timer-core-integration.test.ts](/Users/zainzafar/projects/meelio/meelio/packages/shared/src/stores/timer-core-integration.test.ts)
- [apps/extension/src/tests/timer-boundary.test.ts](/Users/zainzafar/projects/meelio/meelio/apps/extension/src/tests/timer-boundary.test.ts)
- Added the missing `@repo/contracts` and `@repo/core` dependencies to [packages/shared/package.json](/Users/zainzafar/projects/meelio/meelio/packages/shared/package.json) so extension builds can resolve the new timer imports through `@repo/shared`.
- Verification:
- `pnpm --filter @repo/shared test -- src/stores/timer-core-integration.test.ts`
- `pnpm --filter extension test -- src/tests/timer-boundary.test.ts`
- `rg -n '@repo/timer-core' apps packages -g '*.ts' -g '*.tsx'`
- `pnpm install`
- `pnpm validate:extension:timer`

## Timer Core Package Removal

### Plan
- [completed] Find all remaining references to `@repo/timer-core` and replace them with direct `contracts` or `core` imports.
- [completed] Delete `packages/timer-core` now that it is only a shim.
- [completed] Re-run focused verification after the package removal.

### Success Criteria
- No code, tests, or workspace package manifests depend on `@repo/timer-core`.
- `packages/timer-core` no longer exists in the workspace.
- The timer-focused validation and relevant builds/tests still pass after removal.

### Review
- Removed the `packages/timer-core` compatibility package after migrating active timer consumers to `@repo/contracts/timer` and `@repo/core/timer`.
- Cleared the old workspace dependency from `apps/web`, `apps/extension`, and `packages/shared`.
- Remaining `timer-core` mentions are historical notes in planning documents, not live code or package manifests.
- Verification:
- `pnpm --filter @repo/contracts test`
- `pnpm --filter @repo/core test`
- `pnpm --filter @repo/application test`
- `pnpm --filter @repo/shared test -- src/stores/timer-core-integration.test.ts`
- `pnpm --filter web test -- src/tests/timer-boundary.test.ts`
- `pnpm --filter extension test -- src/tests/timer-boundary.test.ts`
- `pnpm --filter web build`
- `pnpm validate:extension:timer`
- `pnpm validate:extension`

## Extension Validator Cleanup

### Plan
- [completed] Split the blocker validator into a true blocker-only scenario.
- [completed] Make `validate:extension` run the focused timer and blocker validators sequentially.
- [completed] Re-run focused and umbrella validation after the command cleanup.

### Success Criteria
- `validate:extension:blocker` does not perform timer smoke assertions.
- `validate:extension` is an umbrella command over the focused timer and blocker validators.
- Timer-focused, blocker-focused, and umbrella validation all pass after the refactor.

### Review
- `scripts/validate/scenarios/extension-blocker-flow.mjs` is now blocker-only and no longer performs timer smoke assertions.
- `scripts/validate/extension.mjs` is now an umbrella command that runs `validate:extension:timer` and `validate:extension:blocker` sequentially.
- Updated validator structural tests so timer localization assertions target the timer scenario and blocker copy assertions target the blocker scenario.
- Verification:
- `pnpm --filter extension test -- src/tests/validator-localization.test.ts`
- `pnpm validate:extension:timer`
- `pnpm validate:extension`
- `pnpm validate:extension:blocker`

## Shared Timer Cleanup

### Plan
- [completed] Replace the legacy shared timer store implementation with a thin compatibility wrapper over `@repo/application/timer`.
- [completed] Collapse shared timer state types onto the application/contracts/core timer types instead of redefining timer behavior in `@repo/shared`.
- [completed] Run focused shared/app/extension verification after the cleanup.

### Success Criteria
- `packages/shared/src/stores/timer.store.ts` no longer duplicates timer orchestration logic.
- `packages/shared/src/types/timer.types.ts` does not redefine the timer state shape already owned by `@repo/application/timer`.
- Shared timer integration tests and extension/web timer boundary checks still pass.

### Review
- Replaced the legacy timer store in `@repo/shared` with a compatibility wrapper over `@repo/application/timer` plus `@repo/infrastructure/timer`.
- Removed the shared-only timer state/type duplication and re-exported the canonical timer state from `@repo/application/timer`.
- Added `@repo/application` and `@repo/infrastructure` as explicit dependencies of `@repo/shared` so the wrapper resolves cleanly.

## Timer Stage Storage Unification

### Plan
- [completed] Add failing storage-layer tests that define the desired `TimerStage`-only persistence contract and legacy numeric-stage normalization behavior.
- [completed] Replace `PersistedPomodoroStage` with `TimerStage` in the DB schema and add a Dexie upgrade path for legacy numeric session rows.
- [completed] Normalize imported/exported focus sessions through the same `TimerStage` contract and remove the persisted-stage compatibility exports.
- [completed] Re-run targeted infrastructure/shared verification plus the focused timer validator after the migration.

### Success Criteria
- `PomodoroSession.stage` is `TimerStage` everywhere the active codebase touches it.
- Existing numeric focus-session rows and imported backups are normalized to `TimerStage` strings instead of breaking on read/import.
- No active code exports or references `PersistedPomodoroStage`.

### Review
- Replaced the persisted numeric stage enum in [packages/infrastructure/src/db/models.dexie.ts](/Users/zainzafar/projects/meelio/meelio/packages/infrastructure/src/db/models.dexie.ts) so `PomodoroSession.stage` now uses `TimerStage`.
- Simplified [packages/infrastructure/src/db/pomodoro.dexie.ts](/Users/zainzafar/projects/meelio/meelio/packages/infrastructure/src/db/pomodoro.dexie.ts) so writes and backfills use `TimerStage` directly instead of a second persisted-stage type.
- Simplified [packages/infrastructure/src/db/meelio.dexie.ts](/Users/zainzafar/projects/meelio/meelio/packages/infrastructure/src/db/meelio.dexie.ts) to keep the v14 schema version without a numeric-stage migration path, because backward compatibility for old stage values is not required.
- Updated [packages/shared/src/utils/export-import.utils.ts](/Users/zainzafar/projects/meelio/meelio/packages/shared/src/utils/export-import.utils.ts) so imported focus sessions use `addPomodoroSession(...)` and stay on the single `TimerStage` storage contract.
- Removed the temporary legacy compatibility layer and deleted the old persisted-stage helper/test files.
- Removed active `PersistedPomodoroStage` exports from the shared/infrastructure DB facades so `TimerStage` is the only active pomodoro stage type.
- Verification:
- `pnpm --filter @repo/infrastructure test -- src/db/pomodoro.dexie.test.ts`
- `pnpm --filter @repo/infrastructure test -- src/infrastructure-boundary.test.ts`
- `pnpm --filter @repo/shared test -- --run`
- `pnpm validate:extension:timer`
- Verification:
- `pnpm --filter @repo/shared test -- src/stores/timer-core-integration.test.ts`
- `pnpm install`
- `pnpm --filter @repo/shared test -- --run`
- `pnpm --filter web test -- src/tests/timer-boundary.test.ts`
- `pnpm --filter extension test -- src/tests/timer-boundary.test.ts`
- `pnpm validate:extension:timer`

## Shared Blocker Core Utility Cleanup

### Plan
- [completed] Add a boundary test proving the shared site blocker store consumes the core blocker helpers instead of a duplicate shared implementation.
- [completed] Point the shared site blocker store and compatibility utility shim at `@repo/core/site-blocker`.
- [completed] Re-run shared package tests and a web build after the cleanup.

### Success Criteria
- `packages/shared/src/stores/site-blocker.store.ts` imports `normalizeSiteHost` from `@repo/core/site-blocker`.
- `packages/shared/src/utils/site-blocker.utils.ts` is only a compatibility re-export.
- Shared blocker-related tests and the web build pass after the cleanup.

### Review
- Added a structural test that locks the shared site blocker store to the core blocker utility layer.
- Removed the duplicate shared host-normalization implementation and re-exported the canonical helper from `@repo/core/site-blocker`.
- Verification:
- `pnpm --filter @repo/shared test -- src/stores/site-blocker-core-integration.test.ts`
- `pnpm --filter @repo/shared test -- --run`
- `pnpm --filter web build`

## Infrastructure Timer Boundary Cleanup

### Plan
- [completed] Audit infrastructure timer dependencies on shared private files and record the cleanup scope in `tasks/todo.md`.
- [completed] Add a failing structural test that forbids filesystem-path imports from `packages/shared` inside infrastructure timer code.
- [completed] Move the timer DB/event implementations and timer sound configuration into `@repo/infrastructure` and update shared wrappers.
- [completed] Run focused infrastructure/shared/web/extension verification and document results.

### Success Criteria
- `packages/infrastructure/src/timer/index.ts` no longer imports from `packages/shared/src/...` by filesystem path.
- Timer DB helpers and timer event bus live in `@repo/infrastructure`, with shared wrappers preserving compatibility.
- Infrastructure/shared tests, web build, and the timer extension validator all pass after the refactor.

### Review
- Moved Dexie DB models, DB setup, and pomodoro summary helpers into `@repo/infrastructure/db`.
- Moved the timer event bus into `@repo/infrastructure/timer` and turned shared timer event/db files into compatibility re-exports.
- Replaced the timer completion sound dependency on the shared sound-sync service with an infrastructure-local pomodoro sound catalog.
- Verification:
- `pnpm --filter @repo/infrastructure test -- src/infrastructure-boundary.test.ts`
- `pnpm --filter @repo/shared test -- --run`
- `pnpm install`
- `pnpm --filter web build`
- `pnpm validate:extension:timer`
