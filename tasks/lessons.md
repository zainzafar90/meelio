# Lessons

- When splitting a feature into new workspace packages, extract one vertical slice first and leave compatibility shims at the old app paths until the rest of the repo is ready to migrate.
- If a shared utility file serves multiple concerns, move only the concern inside the current slice and leave unrelated compatibility helpers in place to avoid accidental regressions.
- When a vertical slice gets a dedicated validator, make it as behavior-rich as the blocker flow; do not stop at a smoke test if the feature exposes meaningful settings and state transitions.
- When an older package already acts like a domain slice, migrate by making the new layered packages the source of truth and converting the old package into a compatibility shim instead of forcing a big-bang import rewrite.
