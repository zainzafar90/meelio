# Zen Mode Focus Orchestration Design

## Goal

Turn the focus dashboard into a true session wrapper that can enter a calm, high-confidence "Zen Mode" and coordinate timer, task focus, soundscapes, site blocking, and optional tab stashing from one primary action.

## Problems To Solve

- Focus currently feels like a timer-first interaction, not a mode transition.
- The dashboard has the right primitives, but not a single orchestration layer that brings them together.
- Soundscapes already react to timer events, but there is no broader session lifecycle that snapshots and restores the user's environment.
- Site blocker and tab stash are available, but they are not framed as part of one intentional focus ritual.
- The current shell does not clearly show what will happen when focus begins, what is enabled, or what the session is actively controlling.

## Product Assumption

- Zen Mode is an explicit session with explicit exit.
- Starting a focus timer can happen inside Zen Mode, but Zen Mode itself does not end automatically on every stage change.
- Zen Mode remains active across breaks until the user presses an explicit `End Zen` action.

## Approaches

### 1. Dedicated Zen Session Controller (Recommended)

Create one shared orchestration layer that owns Zen session state, snapshots the user's pre-session environment, activates enabled modules on entry, and restores the prior environment on exit.

Why this is recommended:

- It matches the product mental model: "enter a zone, then come back out."
- It avoids scattering side effects across timer, dashboard, and browser-only integrations.
- It gives the shell one truthful source of session state.

### 2. Timer-Led Side Effects

Keep the timer as the main source of truth and hang Zen behaviors off timer start / pause / complete events.

Trade-offs:

- Reuses some existing event wiring.
- Too narrow for shell state, task anchoring, tab stash, and restoration.
- Makes Zen Mode feel like "timer plus extras" instead of a first-class mode.

### 3. UI-Only Focus Preset

Add a dashboard preset panel that launches several existing actions in sequence, but do not create a session controller.

Trade-offs:

- Lowest upfront complexity.
- Weak restoration story.
- Harder to test and easier to desynchronize when any module changes independently.

## Desired UX

### Ready State

- The home shell shows a single clear Zen entry control.
- Nearby module chips summarize what the session will use:
  - timer
  - pinned task
  - soundscapes
  - blocker
  - tabs
- Each chip has a clear state:
  - ready
  - off
  - permission needed
  - unavailable on web
- A compact configure affordance opens Zen Mode settings without pushing the user into the full settings dialog if they just want to tweak the session.

### Active Zen State

- The shell compresses into 4-5 core interactions only:
  - active task
  - timer
  - soundscape state
  - blocker state
  - tabs/session state
- The top-level action changes from "start" to "end zen."
- The shell should feel quieter than the current home state, not busier.
- Secondary tools remain accessible, but Zen Mode owns the hierarchy.

### Exit

- Ending Zen restores the user's previous environment where restoration is safe and expected.
- Tab stash should not auto-restore tabs on exit; it should preserve a recoverable stashed session instead.
- The user should never feel punished for trying Zen Mode.

## Settings

Add a persistent Zen Mode settings block with these defaults:

- timer: enabled
- soundscapes: enabled
- pinned-task sync: enabled
- site blocker: enabled
- tab stash: disabled

Also store:

- last selected soundscape behavior or preset strategy
- whether Zen Mode may auto-open module surfaces
- whether extension-only capabilities should be hidden or shown as unavailable on web

## Entry Behavior

When the user enters Zen Mode:

1. Ensure task store is initialized.
2. Read the pinned task as the session anchor when pinned-task sync is enabled.
3. Snapshot the current environment:
   - timer visibility / focus shell state
   - soundscape playback state
   - relevant dock visibility state
   - Zen-owned module activation state
4. Start timer when enabled.
5. Start or resume soundscapes when enabled.
6. Put blocker into focus-session enforcement when enabled.
7. Stash tabs when enabled, supported, and permitted.
8. Switch the shell into active Zen presentation.

## Exit Behavior

When the user ends Zen Mode:

1. Stop Zen session state.
2. Restore the previous soundscape playback state.
3. Restore shell / dock visibility state.
4. Return blocker behavior to the user's normal baseline rather than forcing a new blocker mode.
5. Preserve any stashed tab session for manual restoration later.

## Platform Behavior

### Extension

- Full Zen Mode behavior is available.
- Site blocker activation and tab stash execution are supported.

### Web

- Zen Mode still exists as a shell + timer + task + soundscape experience.
- Site blocker and tab stash render as unavailable or permission-limited rather than pretending to run.
- The plan should not introduce fake parity for browser APIs the web app cannot perform.

## Architecture

### Shared Layer

- Add a dedicated Zen Mode store or orchestration service in shared code.
- Keep it responsible for:
  - session lifecycle
  - session settings
  - snapshot / restore
  - high-level module coordination

### Existing Stores

- Timer store remains the owner of timer mechanics.
- Task store remains the owner of pinned-task and task mutations.
- Soundscapes store remains the owner of playback state.
- Dock store remains the owner of visible surfaces.
- Zen Mode orchestrates these stores but does not absorb their logic.

### Extension Adapters

- Extract tab stashing into a callable service so Zen Mode can invoke it without going through a UI hook.
- Keep blocker runtime updates in extension-specific adapters and background messaging.
- Prefer one orchestration seam over directly scattering extension commands in the dashboard component.

## Scope

- Shared Zen Mode session model and settings
- Focus dashboard UX changes for ready and active states
- Shared orchestration around timer, tasks, soundscapes, and dock state
- Extension-only adapters for blocker sync and tab stash execution
- Localization for new Zen Mode copy

## Non-Goals

- New backend APIs
- Multi-device sync of Zen sessions
- Auto-restoring stashed tabs on Zen exit
- Rebuilding the timer or blocker architecture from scratch
- Expanding Zen Mode to breathing, notes, or bookmarks in the first pass

## Success Criteria

- Starting Zen Mode feels like entering a deliberate environment, not opening a timer.
- The user can tell, before starting, which systems will participate.
- The session restores the environment cleanly on exit.
- The extension experience feels premium, while the web experience degrades honestly.
- The shell is calmer and more focused than the current dashboard while still exposing the right state.
