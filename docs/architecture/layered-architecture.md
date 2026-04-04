# Layered Architecture

## Purpose

This repo uses a layered architecture so web and extension surfaces can share behavior without mixing UI, business logic, persistence, and platform APIs in the same modules.

This document is the canonical rule for where code should live.

## Package Layout

### Apps

- `apps/web`
- `apps/extension`

Apps are composition roots. They should contain:

- entrypoints
- app-specific screens and sheets
- host-specific UI composition
- wiring for the correct platform/runtime adapters

### Packages

- `packages/ui`
  - presentational UI primitives only

- `packages/contracts`
  - shared cross-layer types
  - commands
  - events
  - DTOs
  - payload contracts

- `packages/application`
  - use cases
  - orchestration
  - app-level store logic
  - feature workflows

- `packages/core`
  - pure domain logic
  - state machines
  - normalization
  - business rules

- `packages/platform`
  - host/runtime adapters
  - browser APIs
  - extension APIs
  - workers
  - notifications
  - declarative net request shaping

- `packages/infrastructure`
  - persistence
  - DB implementations
  - storage
  - API clients
  - concrete repositories
  - file/log access

- `packages/shared`
  - transitional compatibility layer
  - shared UI composition
  - should not become the source of truth for business logic

## Dependency Direction

Allowed direction:

- `UI -> application -> core`
- `platform -> application + contracts + core`
- `infrastructure -> contracts + core`

Disallowed direction:

- `core -> platform`
- `core -> infrastructure`
- `core -> React`
- `core -> browser APIs`
- `application -> app-local UI`
- `contracts -> core`
- cross-package filesystem imports into another package’s `src`

## Ownership Rules

### UI

Sheets, dialogs, widgets, and app screens live in:

- `apps/web`
- `apps/extension`
- `packages/shared` only when they are shared UI composition

UI should not own business rules, persistence logic, or platform API calls.

### Contracts

`packages/contracts` owns shared cross-layer type contracts.

Examples:

- timer commands/events/types
- site blocker commands/events/types
- payload contracts shared between app, platform, and core

If a type is needed by multiple layers, prefer putting it in `contracts` and having `core` consume or re-export it if needed.

### Application

`packages/application` owns feature orchestration.

Examples:

- timer store creation and workflows
- site blocker state transitions based on commands

Application code can depend on:

- `@repo/contracts`
- `@repo/core`

Application code must not depend on app-local sheets or direct browser APIs.

### Core

`packages/core` owns pure domain logic.

Examples:

- timer machine and defaults
- site blocker matching logic
- host normalization
- aggregate/session calculations

Core must stay host-agnostic.

If core needs to describe a host-specific outcome, stop at a host-agnostic descriptor.

Example:

- core may return site-blocker pattern lists
- platform turns those patterns into Chrome declarative net request rules

### Platform

`packages/platform` owns host/runtime behavior.

Examples:

- `chrome.runtime`
- `chrome.notifications`
- `chrome.permissions`
- `chrome.declarativeNetRequest`
- web worker wiring
- Web Notification API

Platform may consume contracts, application, or core helpers, but final host-specific payload shaping belongs here.

### Infrastructure

`packages/infrastructure` owns concrete persistence and external integrations.

Examples:

- Dexie models and stores
- timer event persistence
- sound asset lookup
- future API clients and repositories

## Hard Rules

1. Do not import another package by filesystem path.

Use:

- `@repo/core/site-blocker`

Do not use:

- `../../../core/src/site-blocker`

2. If an action is typed as `() => void`, do not return a raw promise.

Consume/log rejections inside the action.

3. Import/export and snapshot ingest paths must re-run normalization.

Raw JSON must not bypass host/pattern canonicalization.

4. Validators must prefer deterministic assertions.

Do not assume a random UI action must produce a unique value unless the product guarantees it.

## Current Status

### Completed

- site blocker is layered across `contracts`, `core`, `application`, and `platform`
- timer is layered across `contracts`, `core`, `application`, `platform`, and `infrastructure`
- `packages/timer-core` has been removed
- extension validators are split into focused feature flows and umbrella commands
- `core` no longer shapes Chrome DNR rules directly
- site blocker shared types now live in `contracts`
- remaining cross-package `src` imports in layered packages have been removed

### Still Transitional

- `packages/shared` still exists as a compatibility and shared UI layer
- some compatibility re-exports remain in app-facing paths to avoid big-bang rewrites

That is acceptable. New business logic should still default to the layered packages above.

## Recommended Default For New Work

When adding a feature:

1. define shared contracts in `packages/contracts` if multiple layers need them
2. add pure rules/state in `packages/core`
3. add orchestration in `packages/application`
4. add runtime adapters in `packages/platform`
5. add persistence/client code in `packages/infrastructure`
6. keep UI in app/shared UI surfaces only

## Validation Commands

Extension validation is feature-oriented and should remain that way:

- `pnpm validate:extension:greeting`
- `pnpm validate:extension:wallpaper`
- `pnpm validate:extension:breathing`
- `pnpm validate:extension:home`
- `pnpm validate:extension:timer`
- `pnpm validate:extension:blocker`
- `pnpm validate:extension`
