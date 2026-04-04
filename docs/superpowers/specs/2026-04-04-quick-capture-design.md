# Quick Capture Design

**Goal:** Add a fast, low-friction capture layer to the focus dashboard so users can create and act on tasks and notes without leaving the dashboard flow.

## Product Thesis

The current focus dashboard helps users orient themselves, but it still lacks a strong action loop. Users can see what matters, but capturing a new task or promoting an item into focus still requires too much context switching.

Phase 2 should make the dashboard actionable in under a few seconds:

- capture a task quickly
- capture a note quickly
- promote captured work into today's focus
- complete or pin relevant items from the dashboard itself

## Scope

Phase 2 includes:

1. Quick Capture bar
- one compact input
- mode switching for task vs note
- fast submit flow

2. Dashboard task actions
- pin/unpin from the dashboard
- mark task complete from the dashboard
- promote captured tasks into the daily focus plan

3. Dashboard actionability refinement
- keep focus-plan and task surfaces aligned
- reduce dependence on opening sheets for basic actions

## UX Principles

- capture must be faster than opening the task or note sheet
- the input should feel lightweight and always available
- common actions should happen inline, not in modals
- the dashboard should remain calm, not turn into a dense control panel

## Architecture Direction

- shared capture contracts go in `packages/contracts`
- pure capture/draft derivation goes in `packages/core`
- action orchestration goes in `packages/application`
- storage adapters remain in `packages/infrastructure` only if needed
- UI composition stays in `packages/shared` and app surfaces

Prefer extending the existing focus dashboard slice with neutral names such as:

- `quick-capture`
- `focus-dashboard-actions`
- `capture-draft`

## Non-Goals

- no command palette yet
- no backend sync work
- no AI capture parsing in this chunk
- no broad notes/tasks redesign outside dashboard-oriented flows
