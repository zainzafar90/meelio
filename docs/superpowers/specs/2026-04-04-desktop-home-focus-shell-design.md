# Desktop Home And Focus Shell Design

**Goal:** Replace the current card-heavy home layout with a calm desktop-style home shell, a persistent bottom dock, and a dedicated immersive focus mode.

## Product Thesis

The current implementation has useful logic, but the shell is still behaving like a dashboard app. The stronger reference direction is a desktop environment:

- home is ambient and sparse
- focus is immersive and singular
- tools live at the edges or behind dock actions
- the viewport is stable and scroll-free

Phase 4 should correct the spatial model before any further polish work.

## Scope

Phase 4 includes:

1. Desktop home shell
- full-screen ambient home surface
- large central clock/greeting/mantra
- one primary CTA
- light peripheral information

2. Persistent dock
- bottom dock is always visible
- layout reserves space for it
- dock acts as the primary tool launcher

3. Focus mode shell
- immersive timer-first mode
- active task beneath the timer
- minimal controls and peripheral utilities
- same wallpaper world, different emphasis

4. Panel-driven tools
- daily plan, tasks, notes, blocker, and similar tools should not all persist on home
- they should open from dock or side actions as dedicated panels/sheets

5. No-scroll adaptive layout
- home and focus shells should fit the viewport
- no main dashboard scrollbar
- tiles/panels must adapt by screen size without breaking the shell

## UX Principles

- home should feel like a desktop, not a dashboard stack
- focus mode should feel like a state change, not a revealed card
- one dominant center at a time
- utilities stay peripheral
- the viewport remains composed at all supported sizes

## Architecture Direction

- preserve the existing layered logic for focus-dashboard, quick-capture, and active focus task derivation
- rework the shared shell composition in `packages/shared`
- use app surfaces only as composition roots
- keep new layout state simple and mode-based

## Non-Goals

- no backend or API work
- no AI features in this chunk
- no full cinematic transition sequence yet
- no blind copying of reference visuals
