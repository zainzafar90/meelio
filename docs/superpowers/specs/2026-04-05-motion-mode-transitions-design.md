# Motion And Mode Transitions Design

## Goal

Add a restrained, premium transition layer between the ambient home shell and the focus shell without changing the underlying product structure.

## Principles

- Motion should clarify state changes, not decorate them.
- Home should feel like it settles away when focus starts.
- Focus should feel more intentional and anchored, not just suddenly swapped in.
- Pills, quote, and dock should animate as shell chrome, not as hero elements.
- Reduced-motion users should keep the same information hierarchy without large transforms.

## Desired Behavior

### Home -> Focus

- Home center fades and lifts out.
- Focus shell fades and rises in.
- Focus overlay strengthens slightly as the timer mode enters.
- Top pills remain present but shift smoothly into their focus arrangement.
- Quote band fades out before the timer settles in.

### Focus -> Home

- Focus shell softens and drops out.
- Home clock/greeting return with a gentle fade/settle.
- Quote band returns only after focus shell is gone.

## Scope

- Shared shell transition choreography in `focus-dashboard.tsx`
- Timer surface entry animation in `timer.tsx`
- Quote visibility timing through existing route composition
- Reduced-motion safe fallbacks

## Non-Goals

- Full cinematic interstitial screens
- New product features
- Sound-driven motion
- Complex stagger systems across every dock icon

## Success Criteria

- Mode changes feel smoother and more deliberate.
- No duplicated or distracting motion.
- Home and focus feel like two states of one environment.
- Web and extension builds remain green.
