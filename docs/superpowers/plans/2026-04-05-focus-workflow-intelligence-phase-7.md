# Phase 7 Plan: Focus Workflow Intelligence

## Task 1: Store Phase 7 Scope

- Add the phase to `tasks/todo.md`
- Keep the work centered on core/application/shared behavior

## Task 2: Model Focus Workflow State

- Extend contracts/core to support richer primary-action derivation
- Make active-task state and CTA state more explicit

## Task 3: Shared Behavior Integration

- Update the shared dashboard behavior for start / resume / switch logic
- Keep UI changes minimal and behavior-focused

## Task 4: Verification

- Run `pnpm --filter @repo/contracts test -- --run`
- Run `pnpm --filter @repo/core test -- --run`
- Run `pnpm --filter @repo/application test -- --run`
- Run `pnpm --filter @repo/shared test -- --run`
- Run `pnpm --filter web build`
- Run `pnpm --filter extension build`
