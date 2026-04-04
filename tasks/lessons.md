# Lessons

- When splitting a feature into new workspace packages, extract one vertical slice first and leave compatibility shims at the old app paths until the rest of the repo is ready to migrate.
- If a shared utility file serves multiple concerns, move only the concern inside the current slice and leave unrelated compatibility helpers in place to avoid accidental regressions.
- When a vertical slice gets a dedicated validator, make it as behavior-rich as the blocker flow; do not stop at a smoke test if the feature exposes meaningful settings and state transitions.
- When an older package already acts like a domain slice, migrate by making the new layered packages the source of truth and converting the old package into a compatibility shim instead of forcing a big-bang import rewrite.
- When moving persistence code into a new package, verify the stored schema types separately from the domain enums; persisted numeric stage values are not interchangeable with string domain enums.
- When a storage-layer constant is needed, name the storage contract explicitly instead of dropping raw values like `0` into domain-adjacent code.
- When a user calls out a type fix as too local, propagate the exact type through every active boundary that touches it, especially export/import paths that otherwise fall back to `any`.
- If the user wants one canonical type, prefer migrating legacy storage onto that type with an explicit upgrade path instead of inventing a second long-lived enum.
- When the user explicitly says backward compatibility is unnecessary, delete the compatibility layer instead of preserving dead migration code.
- When moving DB models into infrastructure, preserve soft-delete fields like `deletedAt` if shared code already filters or hydrates those records as soft-deletable.
- Audit export/import utilities against the current store APIs after refactors; they tend to keep stale property names long after the underlying stores change.
- Split broad home-surface validators by feature once they start mixing unrelated behaviors; compose them back together with a `validate:extension:home` umbrella instead of keeping one oversized scenario.
- Do not run WXT-based extension validators in parallel against the same workspace; they race on `apps/extension/.output/chrome-mv3` and fail with misleading `ENOENT` build errors.
