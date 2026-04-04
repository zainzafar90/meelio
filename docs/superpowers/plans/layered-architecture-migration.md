# Layered Architecture Migration Plan

Canonical architecture rules now live in:

- [docs/architecture/layered-architecture.md](/Users/zainzafar/projects/meelio/meelio/docs/architecture/layered-architecture.md)

This file should be treated as migration history and planning context. The doc above is the source of truth for current package ownership and dependency direction.

## Goal

Refactor the current monorepo into a layered architecture that matches this dependency direction:

1. UI
2. Command/event contract
3. Application
4. Core
5. Provider
6. Infrastructure
7. Platform

Each layer should only depend downward. UI must not call infrastructure or platform APIs directly. Commands/events should be the crossing point for extension-specific runtime traffic.

## Current Architecture Summary

### Existing packages

- `apps/web`: Vite React web app.
- `apps/extension`: WXT browser extension app with background/content/newtab entrypoints.
- `packages/ui`: design-system and primitive UI package.
- `packages/core`: shared domain package containing timer and blocker state logic.
- `packages/shared`: mixed package containing UI, providers, stores, data, utils, db access, and services.
- `packages/logger`: utility package.

### What is already working

- The repo is already a pnpm/turbo monorepo, so the workspace model does not need to change.
- The repo now has a real `packages/core` package for domain logic outside app code.
- `apps/extension/src/features/site-blocker/services` already separates some command contracts and core state logic.

### Main architectural problems

1. `packages/shared` is a god package.
2. App code imports package internals by filesystem path in a few places.
3. UI/state/runtime/persistence concerns are mixed in the same modules.
4. Extension runtime command definitions sit inside app code instead of a reusable contract boundary.
5. Infrastructure concerns like Dexie, browser APIs, and storage mechanics leak upward into app-facing code.

## Recommended Target Package Layout

Use packages for stable boundaries, not for every folder.

### Apps

- `apps/web`
- `apps/extension`

These should contain only:

- entrypoints
- composition roots
- app-specific UI shells
- platform wiring

### Packages

- `packages/ui`
  - presentational React components only
  - no business logic

- `packages/contracts`
  - command/event types
  - DTOs
  - payload schemas
  - no runtime logic

- `packages/application`
  - use cases
  - command handlers
  - orchestration services
  - event emission interfaces
  - depends on `core`, `contracts`

- `packages/core`
  - entities
  - value objects
  - reducers/state machines
  - policy rules
  - no React, no browser APIs, no storage

- `packages/providers`
  - provider interfaces and provider implementations that wrap external capabilities such as LLMs, STT/TTS, search providers, sync providers
  - may depend on `core` contracts
  - should not own UI

- `packages/infrastructure`
  - repositories
  - Dexie/SQLite implementations
  - file system persistence
  - network clients
  - event log writers
  - depends on `core` interfaces and provider abstractions

- `packages/platform`
  - browser/OS-specific adapters
  - Chrome/WXT adapters now, later desktop adapters if the product adds Tauri or native shells
  - owns direct access to `chrome.*`, workers, notifications, alarms, permissions, declarative net request APIs

- `packages/shared` should be retired over time.

## Layer Mapping For This Repo

### UI layer

Move or keep here:

- `apps/web/src/components/*`
- `apps/extension/src/components/*`
- React screens in `packages/shared/src/components/*`

Final rule:

- UI components receive props, stores, or handlers.
- UI should not import Dexie, browser APIs, or feature persistence helpers.

### Command/event contract layer

Best first extraction:

- `apps/extension/src/features/site-blocker/services/blocker-runtime.ts`

Split this into:

- `packages/contracts/src/site-blocker.commands.ts`
- `packages/contracts/src/site-blocker.events.ts`

Keep only:

- command names
- payload types
- response types
- event names

Remove:

- `chrome.runtime.sendMessage`
- permission helpers
- any runtime transport code

### Application layer

Move here:

- command handlers
- workflow coordinators
- feature services that call core logic and repositories

Examples:

- extension background command handling for site blocker
- timer orchestration around notifications, metrics, and stage transitions

This layer can expose interfaces like:

- `BlockerCommandBus`
- `TimerNotifier`
- `SiteBlockerRepository`

### Core layer

Immediate candidates:

- `packages/core/src/timer/*`
- pure parts of `apps/extension/src/features/site-blocker/services/blocker-core.ts`
- pure aggregation and policy logic from `blocker-state.ts`

Rules:

- no React
- no `chrome.*`
- no Dexie
- no direct storage

### Provider layer

This layer is not large in the repo yet. Introduce it only where it clarifies a real boundary.

Likely contents over time:

- sound asset/provider resolution
- sync providers
- future AI/voice integrations

Do not force timer or site blocker code into a provider package unless it is genuinely wrapping an external service.

### Infrastructure layer

Immediate candidates:

- `packages/shared/src/lib/db/*`
- persistence parts of timer and blocker implementations
- `packages/shared/src/services/sound-sync.service.ts`

Target:

- infrastructure implements repository interfaces defined lower in the stack

### Platform layer

Immediate candidates:

- browser notification adapters
- worker adapters
- extension permission adapters
- `chrome.storage`, `chrome.alarms`, `chrome.declarativeNetRequest`, `chrome.runtime`

Files that point here already:

- `apps/extension/src/utils/extension-permissions.ts`
- extension background runtime transport
- `apps/web/src/stores/web.timer.store.ts` notification and worker wiring

## Recommended Migration Strategy

Do not split everything at once. Use four phases.

### Phase 1: Enforce package boundaries around existing clean seams

1. Create `packages/contracts`, `packages/core`, `packages/application`, `packages/infrastructure`, and `packages/platform`.
2. Keep timer state machine and defaults in `packages/core/timer` and point remaining consumers there directly.
3. Extract extension site-blocker command/response types into `packages/contracts`.
4. Replace direct relative imports into `packages/shared/src/...` with package exports only.

Success criteria:

- no app imports from another package’s private filesystem paths
- contracts are transport-agnostic

### Phase 2: Break up `packages/shared`

1. Stop adding new exports to `packages/shared/src/index.ts`.
2. Classify each `shared` module as one of: UI, application, core, infrastructure, or platform.
3. Move pure utilities and domain state into `core`.
4. Move db and persistence modules into `infrastructure`.
5. Leave thin compatibility exports in `shared` temporarily if needed.

Success criteria:

- `shared` becomes a compatibility shim instead of the real architecture

### Phase 3: Move runtime orchestration out of UI-facing stores

1. Split stores into:
   - UI state stores
   - application services/use cases
   - platform adapters
2. Refactor timer runtime wiring in web and extension so workers/notifications/storage are injected adapters.
3. Make background handlers call application services instead of core functions directly.

Success criteria:

- runtime-specific code is isolated from pure state transitions

### Phase 4: Remove `shared` as a mixed dependency

1. Point apps directly to the right layer packages.
2. Delete obsolete compatibility re-exports.
3. Add lint rules for dependency direction.
4. Add boundary tests for each package.

Success criteria:

- package dependencies reflect the intended architecture
- no cross-layer import leaks

## Practical Package Recommendation

For this codebase, the most pragmatic package split is:

- Keep `packages/ui`
- Keep `packages/contracts`
- Add `packages/application`
- Keep `packages/core`
- Add `packages/infrastructure`
- Add `packages/platform`

Delay `packages/providers` until there are at least two real provider implementations sharing a stable interface. Right now it is a conceptual layer more than a necessary package.

That means the answer is:

- yes, split into layers
- yes, use packages for the stable layers
- no, do not force every conceptual layer into a package on day one

## Dependency Rules To Enforce

- `apps/*` may depend on `ui`, `contracts`, `application`, `core`, `platform`
- `ui` may depend on `contracts` and view-model types, but not on infrastructure
- `application` may depend on `contracts` and `core`
- `core` depends on nothing app-specific
- `infrastructure` may depend on `core`
- `platform` may depend on `contracts`, `application`, `core`, `infrastructure`
- no package may import another package’s `src/*` path directly

## High-Value First Refactors

1. Extract site-blocker command/event types from extension runtime into `packages/contracts`.
2. Move site-blocker pure policy logic into a `core` package.
3. Create a repository interface for blocker state persistence.
4. Move Dexie and browser storage implementations into `infrastructure` or `platform` as appropriate.
5. Refactor timer stores so domain transitions remain in core and app-specific runtime behavior becomes adapters.

## Verification Plan

After each phase:

1. Run package-level tests for affected packages.
2. Run boundary tests to prove imports flow the correct way.
3. Build both `apps/web` and `apps/extension`.
4. Add one test per new boundary that would fail if an upper layer imported a lower forbidden layer.

## Risks

- Over-splitting too early will create churn without clarity.
- Moving UI before core/application seams are stable will multiply regressions.
- Keeping `shared` as a convenience export for too long will prevent the migration from finishing.

## Recommended Next Task

Start with one vertical slice only:

- site blocker

Use it to establish:

- `contracts`
- `core`
- `application`
- `platform`

Once that works, repeat the same pattern for timer.
