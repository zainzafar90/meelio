# Lessons

- Do not place Vitest files inside `apps/extension/src/entrypoints`. WXT scans that directory as production entrypoints during `dev`, which causes duplicate-entrypoint failures like `content` vs `content.test`.
- For extension permission flows, follow the existing bookmarks/tab-stash pattern: request optional permissions from the UI click handler, not from the background worker.
- For DNR redirects to extension-owned pages, use `redirect.extensionPath` and declare the target page as a web-accessible resource. Using `redirect.url` to a `chrome-extension://...` page is the wrong shape and breaks runtime rule updates.
- Do not encode blocker context into `redirect.extensionPath`. The blocked page must recover `pattern` and `originalUrl` from the background tab map, because query-bearing extension redirect paths are not part of the agreed architecture and can break the shared DNR sync path that every drawer action depends on.
- Do not rely only on `chrome.storage.onChanged` for immediate extension UI feedback. When a drawer action gets a command response containing the next state, update local UI state immediately and let storage sync act as the secondary source of truth.
- Do not claim an extension UI bug is fixed without browser-level interaction proof on the actual `chrome-extension://...` page. Tests, builds, and code inspection are not enough when the user reports dead controls.
- If an extension UI is stuck in bootstrapping state, trace the full runtime message path before changing surface components. A hanging or broken background `get-state` handler can make every control look dead even when the DOM is fine.
- Never import the extension background worker from the `@repo/shared` root barrel. For MV3 worker code, import the exact shared file you need, or the worker bundle can pull in client-only stores/components and fail before `chrome.runtime.onMessage` is registered.
- When the user asks to see the complexity or shape of a long-term design, do not answer with only a clarifying question. First provide the concrete architecture, migration scope, and tradeoffs, then ask at most one narrowing question if still needed.
