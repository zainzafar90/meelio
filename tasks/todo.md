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

## Translation Delta: Phase 5 -> Current Branch

- [x] Diff `feat/focus-dashboard-phase-5` against the current branch to identify new or changed user-facing copy
- [x] Add missing task-focus translation keys for every supported locale
- [x] Update the onboarding timer copy in every non-English locale
- [x] Add missing focus-dashboard shell translation keys for every supported locale
- [x] Replace hardcoded focus-dashboard shell strings with locale lookups
- [x] Verify locale keys exist and run targeted shared verification

## Review

- Diffing `feat/focus-dashboard-phase-5` against the current branch surfaced an additional localization delta in the new focus-dashboard shell after screenshot review.
- Added `tasks.item.focus`, `tasks.item.focused`, `tasks.item.focusTitle`, and `tasks.item.focusedTitle` to every supported locale so the task-list focus action no longer falls back to English.
- Updated every non-English locale’s onboarding timer copy to match the new English “Focus Timer” wording instead of the older Pomodoro framing.
- Added a dedicated `focusDashboard` translation block to every supported locale for the new shell copy, including `Ready to focus`, `{{time}} remaining`, `Start Focusing`, active-task labeling, calendar fallbacks, and task-count pill values.
- The focus-dashboard shell now renders translated strings at the component layer instead of relying on English text stored in the dashboard snapshot, which removes the screenshot-visible English copy from the pills and hero label.
- `getAgendaPillValue` now accepts translated fallback labels and once again returns a no-event fallback, restoring the intended pill behavior and fixing the related helper regression test.
- Verification:
  - `for f in packages/shared/src/i18n/locales/{en,de,es,fr,pt,ru,ja,zh,ar}/translation.json; do jq -e '.onboarding.timer.title and .onboarding.timer.description and .tasks.item.focus and .tasks.item.focused and .tasks.item.focusTitle and .tasks.item.focusedTitle' "$f" >/dev/null || exit 1; done && echo 'locale key verification passed'`
  - `for f in packages/shared/src/i18n/locales/{en,de,es,fr,pt,ru,ja,zh,ar}/translation.json; do jq -e '.focusDashboard.timer.ready and .focusDashboard.timer.remaining and .focusDashboard.tasks.queuedCount and .focusDashboard.tasks.doneCount and .focusDashboard.activeTask.label and .focusDashboard.activeTask.empty and .focusDashboard.calendar.noUpcomingEvent and .focusDashboard.calendar.allDayEvent and .focusDashboard.calendar.upcomingEvent and .focusDashboard.calendar.nextEventLabel and .focusDashboard.actions.startFocusing' "$f" >/dev/null || exit 1; done && echo 'focus dashboard locale key verification passed'`
  - `pnpm --filter @repo/shared test -- src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts src/components/core/task-list/components/task-list.helpers.test.ts src/i18n/localization-completeness.test.ts --run`
  - `pnpm --filter @repo/shared test -- --run`

## Zen Mode Focus Orchestration

- [x] Explore the current focus-dashboard, timer, soundscapes, site-blocker, task, and dock integration points
- [ ] Offer visual companion for shell and interaction design discussion
- [x] Confirm the Zen Mode lifecycle assumption: explicit session enter/exit, not toggle on every timer stage change
- [x] Lock the UX model for the primary control: one-tap enter, visible module readiness, and compact configuration access
- [ ] Add persistent Zen Mode settings with defaults:
  - [x] timer enabled by default
  - [x] soundscapes enabled by default
  - [x] pinned-task sync enabled by default
  - [x] site blocker enabled by default
  - [x] tab stash disabled by default
- [x] Define the shared Zen Mode orchestration layer that snapshots pre-session state and restores it on exit
- [ ] Extract extension-only actions behind callable services instead of UI-only hooks:
  - [x] tab stashing
  - [x] blocker focus activation sync
- [x] Define dashboard UX states:
  - [x] ready state with module readiness chips
  - [x] active Zen Mode shell with 4-5 core interactions
  - [x] degraded web behavior when extension-only capabilities are unavailable
  - [x] permission-needed states for blocker/tab stash
- [ ] Define start-session behavior:
  - [x] ensure task store is initialized
  - [x] use pinned task as session anchor when available
  - [x] start timer
  - [x] start or resume soundscape preset when enabled
  - [x] activate blocker in focus mode when enabled
  - [x] stash tabs when enabled and permissions allow
- [ ] Define end-session behavior:
  - [x] stop Zen Mode explicitly
  - [x] restore prior soundscape playback state
  - [x] restore prior dock/shell visibility state
  - [x] release blocker back to the user’s non-session baseline
  - [x] leave stashed tabs recoverable without destructive auto-restore
- [x] Propose 2-3 orchestration and UX approaches with recommendation
- [x] Present the Zen Mode design for approval
- [x] Write the Zen Mode spec
- [x] Review the written spec with the user
- [x] Write the implementation plan

## Review

- Zen Mode now exists as an explicit shared session layer with persisted defaults, browser-capability awareness, and clean restoration of dock visibility, soundscapes, blocker state, and optional tab stashing.
- The focus dashboard now has a real Zen ready state with module-readiness chips and compact configuration access, plus an active Zen shell centered on the current task, timer, module state, and explicit exit.
- Tab stashing was extracted into a callable service so both the sheet and Zen Mode use the same behavior instead of duplicating tab logic inside a React hook.
- The extension runtime now upgrades blocker enforcement into focus-only mode for the session, then restores the user’s previous blocker baseline on exit.
- Locale coverage now includes the new Zen Mode settings and dashboard shell copy across every supported language.
- Verification:
  - `pnpm --filter @repo/shared test -- --run`
  - `pnpm --filter web build`

## Focus Dashboard Translation Fix

- [x] Inspect the recent focus-dashboard empty-state copy changes and impacted locale keys
- [x] Run localization completeness verification to confirm the current failure
- [x] Update every supported locale with the new focus-dashboard active-task keys and copy
- [x] Re-run localization and build verification
- [x] Document the translation fix results

## Review

- The recent empty-state copy change added `focusDashboard.activeTask.emptyLabel` only in English, so every non-English locale failed localization completeness and risked mixed fallback copy in focus and Zen mode.
- Added `emptyLabel` to every supported non-English locale and shortened the `empty` copy in those same locale blocks so the focus-dashboard empty state now matches the new UX across languages.
- Verification:
  - `pnpm --filter @repo/shared test -- src/i18n/localization-completeness.test.ts --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`

## Zen CTA Pill Refresh

- [x] Inspect the current home-shell Zen CTA, top pill row, and recent related commits
- [x] Offer visual companion for the Zen CTA/pill redesign discussion
- [x] Confirm the desired interaction model for moving the primary Zen CTA into the top pill area
- [x] Propose UI approaches for a top-pill CTA with popover or expanded action surface
- [x] Present the recommended design and get approval before implementation
- [x] Implement the approved Zen CTA/pill layout in the focus dashboard shell
- [x] Verify the affected shared tests and app builds
- [x] Document review notes and verification results

## Review

- The persistent bottom Zen launch rail was removed from the home shell so Zen entry now has one clear location instead of competing with the main content area.
- The first top pill now reads like an action instead of a vague status by using the Zen entry copy in the trigger rather than a generic `Ready` value.
- The popover no longer repeats `Ready` in the header or for every module. Included modules render as compact chips, while only non-ready exceptions stay in subdued secondary text.
- `AmbientPill` still carries the interactive trigger styling through lightweight adornment and class overrides, but the body content is now materially quieter and more legible.
- Added helper coverage for the Zen launch summary grouping so the popover does not regress back into per-item `Ready` repetition.
- Follow-up polish softened pill contrast and shadow across the shell, restored icons inside the Zen summary chips/exceptions, and lightened the eyebrow/subtitle hierarchy so the panel stays minimal while scanning faster.
- Verification:
  - `pnpm --filter @repo/shared test -- src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`

## Focus Dashboard Refactor

- [x] Audit the current `focus-dashboard.tsx` responsibilities and related helpers/tests
- [x] Run React Doctor against the workspace and capture dashboard-specific findings
- [x] Present the refactor design direction for approval
- [x] Write the approved implementation plan into this todo
- [x] Extract dashboard state selection and derived labels into a focused view-model hook
- [x] Keep `focus-dashboard.tsx` as the orchestration container for effects and mode switching only
- [x] Split home, focus, and zen shells into dedicated component files
- [x] Split shared dashboard primitives (`ambient-pill`, `zen-primary-action`, `zen-session-controls`) into dedicated component files
- [x] Replace clickable non-semantic task headings with semantic button affordances where selection is actionable
- [x] Preserve the current ambient visual language while simplifying render composition
- [x] Verify targeted shared tests and re-run React Doctor for the affected area

## Review

- `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx` is 1,105 lines and currently mixes store selection, runtime effects, state synchronization, motion orchestration, and all three dashboard shells in one file.
- React Doctor flagged the file for giant-component architecture, a multi-`setState` effect in Zen controls, and non-semantic interactive wrappers in the focus/zen task headings.
- The clean split is around four concerns: dashboard data/orchestration, home shell, focus shell(s), and small shared primitives like pills and Zen action rails.
- Approved direction: keep the current wallpaper-first ambient shell, but refactor the implementation into a thin container plus smaller presentational units so the code reads by responsibility instead of by screen state.
- The main `focus-dashboard.tsx` container is now down to 281 lines and the presentational shells/primitives live in focused component files under `components/`, while a dedicated `use-focus-dashboard-view-model` hook owns the derived dashboard state.
- The selectable task headings in focus and Zen modes now use semantic buttons when they open task selection, which removes the original non-interactive click handling from this surface.
- Added helper coverage for task prioritization and pinned-task selection so the extracted view-model logic keeps the same task ordering behavior.
- Verification:
  - `pnpm --filter @repo/shared test -- src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts src/stores/focus-dashboard.store.test.ts --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `git diff --check`
  - `npx -y react-doctor@latest packages/shared --verbose`

## Zen Mode Blocker Sync Correction

- [x] Reproduce the current Zen blocker activation path against real focus state changes
- [x] Bind Zen blocker activity to timer focus transitions instead of only session start/end
- [x] Verify the extension blocker returns inactive outside focus while Zen remains enabled

## Review

- Zen blocker control is now explicitly synchronized from live timer state while Zen is active, instead of inferring “focus active” from session entry alone.
- Entering Zen still moves the blocker into `focus-only` mode when that setting is enabled, but actual blocking now follows real focus state transitions, so breaks, pauses, and other out-of-focus states correctly deactivate enforcement without ending the Zen session.
- Verification:
  - `pnpm --filter @repo/shared test -- src/stores/zen-mode.store.test.ts --run`
  - `pnpm --filter extension build`
  - `git diff --check`

## Zen Controls Visibility Polish

- [x] Inspect the active Zen shell controls ownership and current opacity behavior
- [x] Confirm the preferred direction: keep frosted semi-white controls while moving fade behavior to the shared controls wrapper
- [ ] Update the shared Zen controls cluster to reveal fully on extension focus, hover, or focus-within
- [ ] Keep the button surfaces calm and translucent instead of bright white
- [ ] Verify the affected shared surface and document the result

## Zen Mode Minimal Shell Redesign

- [x] Remove the duplicated Zen chrome from the home shell and restore a cleaner wallpaper-first hierarchy
- [x] Move Zen entry out of the top-left and into a calmer dedicated launch surface
- [x] Replace active Zen pill rows with a quieter single-line system summary
- [x] Keep controls in one stable area with low-presence hover reveal behavior
- [x] Make the dock recede during active Zen and return on hover without using hard borders
- [x] Verify web and extension builds after the shell redesign

## Review

- Zen entry now lives in a dedicated bottom ritual rail on the home shell instead of competing with the ambient top metadata, which restores the wallpaper-first hierarchy.
- Active Zen now keeps its session controls in that same bottom zone, so configure and end actions no longer jump to a different corner or compete with the task and timer.
- The old five-pill Zen status row was replaced with a single text-first system summary, which preserves readiness visibility without adding bordered chrome.
- The dock now recedes during active Zen and comes forward on hover or focus, giving the session a more immersive feel without hiding functionality.
- Verification:
  - `pnpm --filter @repo/shared test -- src/components/core/focus-dashboard/focus-dashboard.helpers.test.ts src/stores/zen-mode.store.test.ts --run`
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `git diff --check`

## Zen Session Controls Reveal Tuning

- [x] Confirm where active Zen controls derive their visibility and surface styling
- [x] Make the shared Zen controls cluster fully visible when the extension window is focused or the controls are hovered/focus-within
- [x] Keep the Zen action buttons on a softer frosted white surface instead of relying on stronger button chrome
- [x] Verify the affected shared focus-dashboard surface with targeted tests/build checks

## Review

- Active Zen controls no longer depend on a timer-based cursor fade to become fully visible in the extension. The shared controls cluster now reveals at full opacity whenever the extension window itself is focused, while web still keeps the quieter hover/focus-within reveal.
- The `Zen Settings` and `End Zen` buttons now sit on a softer frosted treatment with backdrop blur and stable translucent white fills, instead of the heavier gradient chrome that made the control group feel louder.
- Verification:
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `git diff --check`
  - `node --input-type=module <<'EOF' ... EOF` to force active Zen in the built extension newtab and confirm the `End Zen` controls wrapper reports computed `opacity: 1` while focused, with a blurred translucent button surface

## Zen Controls Blur Correction

- [x] Remove black border/shadow treatment from the active Zen controls rail and buttons
- [x] Keep the blur-backed surface mounted continuously instead of revealing it via overall opacity
- [x] Verify the corrected Zen controls styles in fresh web and extension builds plus a focused runtime inspection

## Review

- The active Zen controls rail no longer uses any dark border or shadow treatment. The rail surface and both buttons now rely on translucent white fills plus persistent blur instead of outlined chrome.
- The blur layer is now a separate always-mounted element inside the controls rail, so the reveal no longer depends on fading the blur surface itself in and out. Only the fill/text emphasis changes between calm and active states.
- Verification:
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `git diff --check`
  - `node --input-type=module <<'EOF' ... EOF` to inspect the built extension newtab in active Zen and confirm:
    - controls surface `boxShadow: none`
    - end button `borderTopWidth: 0px`
    - end button `boxShadow: none`
    - button `backdropFilter: blur(24px)`
    - dedicated blur layer `backdropFilter: blur(40px)`

## Zen Controls Dock Separation

- [x] Move the active Zen controls into their own lane above the dock band
- [x] Make both Zen actions use the requested white surface treatment
- [x] Verify the updated layout and control styling in fresh builds

## Zen Controls Quiet-State Calibration

- [x] Confirm the focused-out state is still too visually active
- [x] Reduce quiet-state control emphasis while preserving persistent blur
- [x] Verify the focused-out style values after the calibration change

## Zen Controls Mouse Activity Reveal

- [x] Replace `windowFocused` as the main reveal trigger with short-lived mouse activity
- [x] Keep hover and focus-within as direct reveal signals for the controls themselves
- [x] Verify the quiet state stays recessed until mouse movement occurs, then reveals smoothly

## Review

- The active Zen controls no longer reveal just because the window is focused. They now stay recessed until there is real mouse movement, direct hover, or focus within the controls.
- Mouse activity is handled as a short-lived pulse, so the controls brighten smoothly when the pointer moves and then settle back to the quiet state without relying on permanent window-focus presence.
- Verification:
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `git diff --check`
  - `node --input-type=module <<'EOF' ... EOF` to inspect the built extension newtab in active Zen and confirm:
    - before mouse movement: row `opacity: 0.55`, button `backgroundColor: rgba(255, 255, 255, 0.54)`
    - after mouse movement: row `opacity: 0.809962`, button `backgroundColor: rgba(255, 255, 255, 0.737)`

## Review

- The active Zen controls now sit in a higher lane above the dock band, so they no longer share the same bottom slot as the dock.
- Both `Zen Settings` and `End Zen` now use the same white surface treatment, but the focused-out state is intentionally subdued by lowering content opacity and button fill instead of leaving both actions near full white.
- Verification:
  - `pnpm --filter web build`
  - `pnpm --filter extension build`
  - `git diff --check`
  - `node --input-type=module <<'EOF' ... EOF` to inspect the built extension newtab in active Zen and confirm:
    - wrapper `bottom: 112px`
    - focused-out row `opacity: 0.722864`
    - both buttons `backgroundColor: rgba(255, 255, 255, 0.67)`
