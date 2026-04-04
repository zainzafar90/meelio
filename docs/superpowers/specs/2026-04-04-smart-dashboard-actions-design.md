# Smart Dashboard Actions Design

**Goal:** Make the focus dashboard better at deciding what the user should do next by centering the current pinned task, tightening the primary CTA, and making agenda timing more actionable.

## Product Thesis

The dashboard now supports capture and inline task actions, but it still behaves mostly like a smart status board. The next step is to make the dashboard actively guide the user toward the best next action.

Phase 3 should answer:

- what is the current focus task?
- is there enough time to start a session before the next event?
- what should the primary CTA say right now?

## Scope

Phase 3 includes:

1. Active focus task framing
- treat the pinned task as the active focus task
- surface it clearly in the hero and task list
- let users explicitly start focus on a task from the dashboard

2. Smarter primary action
- if a pinned task exists, the CTA should reference it
- if time before the next event is short, the CTA should soften the suggestion
- if there is no pinned task, the CTA should push the user to choose one

3. Agenda-aware guidance
- show the safe focus window before the next event
- distinguish clear time, short window, and in-progress event states
- keep this guidance short and ambient rather than verbose

## UX Principles

- one obvious next action should exist at all times
- the dashboard should guide without becoming bossy
- task state, timer state, and agenda state should feel coordinated
- copy should stay calm and concise

## Architecture Direction

- extend the existing `focus-dashboard` contracts/core/application slice
- keep active-focus derivation in pure logic
- keep shared UI as composition only
- continue using the pinned task as the operative focus task model

## Non-Goals

- no new backend or sync work
- no command palette
- no AI planning logic in this chunk
- no redesign of the timer system
