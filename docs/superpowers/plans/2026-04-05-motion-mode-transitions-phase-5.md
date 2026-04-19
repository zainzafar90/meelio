# Phase 5 Plan: Motion And Mode Transitions

## Task 1: Store Phase 5 Scope

- Add Phase 5 motion scope to `tasks/todo.md`
- Keep the phase limited to shared shell motion and timer entry

## Task 2: Shell Transition Layer

- Use existing `showTimerPanel` state as the mode transition boundary
- Animate home and focus shells with restrained opacity / translate / blur changes
- Keep top pill chrome in place while allowing small layout motion

## Task 3: Timer Entrance

- Animate the timer surface entrance inside focus mode
- Keep controls readable and avoid excessive scaling

## Task 4: Quote And Dock Timing

- Keep dock stable
- Fade quote band in home only and ensure it disappears during focus mode

## Task 5: Verification

- Run `pnpm --filter @repo/shared test -- --run`
- Run `pnpm --filter web build`
- Run `pnpm --filter extension build`
