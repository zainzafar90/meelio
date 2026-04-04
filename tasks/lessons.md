# Lessons

- When splitting a feature into new workspace packages, extract one vertical slice first and leave compatibility shims at the old app paths until the rest of the repo is ready to migrate.
- If a shared utility file serves multiple concerns, move only the concern inside the current slice and leave unrelated compatibility helpers in place to avoid accidental regressions.
- When a vertical slice gets a dedicated validator, make it as behavior-rich as the blocker flow; do not stop at a smoke test if the feature exposes meaningful settings and state transitions.
- When an older package already acts like a domain slice, migrate by making the new layered packages the source of truth and converting the old package into a compatibility shim instead of forcing a big-bang import rewrite.
- If an action is typed as fire-and-forget (`() => void`), never return a raw promise from the implementation. Consume and log rejections inside the action so callers do not trigger unhandled promise rejections.
- In validators, never assert that a single random UI action must produce a different value unless the product code guarantees uniqueness. Prefer deterministic side effects like setting toggles, persisted flags, or existence checks.
- When importing persisted snapshots or raw JSON backups, re-run the same normalization/canonicalization steps used for live user input. Refactors that move import code can silently drop those ingest guarantees.
- Keep `contracts` as the owner of cross-layer shared types and let `core` consume/re-export them. If `contracts` starts importing from `core`, you will recreate the package cycle the layered split is supposed to remove.
- If `core` needs host-specific output, stop at host-agnostic descriptors or pattern lists and let `platform` shape the final browser/OS API payloads.
