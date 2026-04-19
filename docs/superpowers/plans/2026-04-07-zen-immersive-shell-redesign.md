# Zen Immersive Shell Redesign

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform active Zen mode into a fully immersive experience where the dock slides off-screen, session controls dissolve into minimal inline elements, and the wallpaper dominates.

**Architecture:** Overlay transformation approach — keep the existing component tree but aggressively restyle when Zen is active. Dock gets `translate-y-full` with an invisible hover zone for recall. ZenSessionRail card is eliminated and replaced with inline controls below the timer. Status summary condenses to one plain text line.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Zustand, Lucide icons

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/shared/src/components/core/dock/dock.tsx` | Modify | Dock slides fully off-screen in Zen, hover zone recalls it |
| `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx` | Modify | Strip ZenModeShell center, replace ZenSessionRail with inline controls, build status summary string |
| `packages/shared/src/components/core/focus-dashboard/components/zen-mode-status-row.tsx` | Modify | Add `ZenModeStatusSummary` — single-line text condensation of active items |

---

## Chunk 1: Dock off-screen behavior

### Task 1: Dock slides fully off-screen during active Zen

**Files:**
- Modify: `packages/shared/src/components/core/dock/dock.tsx:219-244`

- [ ] **Step 1: Replace dock Zen styling with full off-screen translation**

In `dock.tsx`, the outer wrapper div (line ~222-227) currently applies:
```
isZenActive && "hover:translate-y-0 hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100"
```

And the inner container (line ~236-239) applies:
```
isZenActive && "translate-y-5 opacity-40 saturate-75 hover:translate-y-0 hover:opacity-100 hover:saturate-100 focus-within:translate-y-0 focus-within:opacity-100 focus-within:saturate-100"
```

Replace the **outer wrapper** classes with:
```tsx
<div
  className={cn(
    "relative z-50 transition-all duration-500 ease-out",
    isZenActive && "translate-y-[calc(100%+1rem)] opacity-0 hover:translate-y-0 hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100"
  )}
  ref={dockRef}
>
```

Replace the **inner container** classes with:
```tsx
<div
  className={cn(
    "rounded-2xl border border-white/10 bg-zinc-400/10 p-3 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out",
    isZenActive && "duration-700"
  )}
>
```

The outer div now handles all Zen translation/opacity (fully off-screen). The inner div just gets a slower transition duration for the calmer exit feel. No saturate changes needed since it's fully hidden.

- [ ] **Step 2: Remove the decorative white pill indicator**

Delete the block at lines ~229-233:
```tsx
{isZenActive && (
  <div className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center">
    <div className="h-1 w-14 rounded-full bg-white/18 shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-opacity duration-300" />
  </div>
)}
```

This pill floating above a fully hidden dock looks broken. Remove it entirely.

- [ ] **Step 3: Add invisible hover zone for dock recall**

After the closing `</div>` of the dock container but still inside the outer wrapper, add a hover zone:
```tsx
{isZenActive && (
  <div
    className="absolute inset-x-0 -top-10 h-10"
    aria-hidden="true"
  />
)}
```

This 40px invisible zone above the dock catches the mouse as it approaches the bottom edge. Because it's inside the outer wrapper that has the hover classes, hovering this zone triggers the dock slide-up.

- [ ] **Step 4: Verify build**

Run: `pnpm --filter web build`
Expected: successful build with no errors

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/components/core/dock/dock.tsx
git commit -m "feat(zen-mode): dock slides fully off-screen with hover recall"
```

---

## Chunk 2: ZenModeShell stripped center

### Task 2: Remove eyebrow, subtitle, and excess padding from ZenModeShell

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx:855-933`

- [ ] **Step 1: Strip the ZenModeShell center content**

In the `ZenModeShell` component (line ~886), the center column currently renders:
- eyebrow (`activeFocusTaskEyebrow`)
- task title (`activeFocusTaskLabel`)
- subtitle (`activeSubtitle`)
- timer panel

Replace the center content area (lines ~890-918) with:
```tsx
<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 pt-6">
  <div className="max-w-5xl text-center">
    <h2
      className="cursor-default text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl lg:text-5xl"
      onClick={activeFocusTaskId ? undefined : onSelectTask}
    >
      {activeFocusTaskLabel}
    </h2>
  </div>
  {timerEnabled && (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
      className="w-full"
    >
      {timerPanel}
    </motion.div>
  )}
</div>
```

Key changes:
- Removed eyebrow paragraph
- Removed subtitle paragraph
- Removed `pb-28 sm:pb-32` (no longer need bottom padding for the session rail card)
- Content is truly centered now

- [ ] **Step 2: Deepen the vignette overlay**

In the same component, update the backdrop overlays (lines ~887-888):

Change `bg-black/9` to `bg-black/12`:
```tsx
<div className="pointer-events-none absolute inset-0 bg-black/12 backdrop-blur-[10px]" />
```

This gives a deeper, more cinematic feel.

- [ ] **Step 3: Remove unused props from ZenModeShell**

Remove `activeLabel`, `activeSubtitle`, and `activeFocusTaskEyebrow` from the component's props interface and destructuring since they're no longer rendered.

Updated interface:
```tsx
const ZenModeShell = ({
  timerPanel,
  timerEnabled,
  currentTimerLabel,
  activeFocusTaskLabel,
  activeFocusTaskId,
  statusItems,
  endZenLabel,
  configureLabel,
  onEndZen,
  onConfigure,
  onSelectTask,
}: {
  timerPanel: ReactNode;
  timerEnabled: boolean;
  currentTimerLabel: string;
  activeFocusTaskLabel: string;
  activeFocusTaskId: string | null | undefined;
  statusItems: ZenModeStatusItem[];
  endZenLabel: string;
  configureLabel: string;
  onEndZen: () => void;
  onConfigure: () => void;
  onSelectTask: () => void;
}) => (
```

- [ ] **Step 4: Update the ZenModeShell call site to remove unused props**

In `FocusDashboard` (line ~625), remove the now-unused props:
```tsx
<ZenModeShell
  timerPanel={timerPanel}
  timerEnabled={zenMode.timerEnabled}
  currentTimerLabel={currentTimerLabel}
  activeFocusTaskLabel={zenActiveTaskLabel}
  activeFocusTaskId={zenActiveTaskId}
  statusItems={zenActiveItems}
  endZenLabel={zenEndLabel}
  configureLabel={zenConfigureLabel}
  onEndZen={handleEndZenMode}
  onConfigure={handleConfigureZenMode}
  onSelectTask={toggleTasks}
/>
```

Remove `activeLabel={zenActiveLabel}`, `activeSubtitle={zenActiveSubtitle}`, and `activeFocusTaskEyebrow={activeFocusTaskEyebrow}` from the call.

- [ ] **Step 5: Verify build**

Run: `pnpm --filter web build`
Expected: successful build, no unused variable warnings

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx
git commit -m "feat(zen-mode): strip ZenModeShell to task + timer with deeper vignette"
```

---

## Chunk 3: Inline session controls replacing ZenSessionRail

### Task 3: Build inline Zen controls and status summary

**Files:**
- Modify: `packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx:855-933,978-1020`
- Modify: `packages/shared/src/components/core/focus-dashboard/components/zen-mode-status-row.tsx`

- [ ] **Step 1: Add `ZenModeStatusSummary` to the status row file**

In `zen-mode-status-row.tsx`, add a new component that condenses status items into a single text line. Append after the existing `ZenModeStatusLine`:

```tsx
export const ZenModeStatusSummary = ({
  items,
  className,
}: {
  items: ZenModeStatusItem[];
  className?: string;
}) => {
  const activeItems = items.filter((item) => item.tone !== "off");
  if (activeItems.length === 0) return null;

  return (
    <p
      className={cn(
        "text-center text-xs text-white/40 transition-opacity duration-300 hover:text-white/70",
        className,
      )}
    >
      {activeItems.map((item, index) => (
        <span key={`${item.label}-${item.value}-summary`}>
          {index > 0 && <span className="mx-1.5">·</span>}
          <span>{item.value}</span>
        </span>
      ))}
    </p>
  );
};
```

No icons, no uppercase labels, no tone colors. Just the values joined by dots.

- [ ] **Step 2: Import `ZenModeStatusSummary` in focus-dashboard.tsx**

Update the import at the top of `focus-dashboard.tsx`:
```tsx
import {
  ZenModeStatusLine,
  ZenModeStatusSummary,
  type ZenModeStatusItem,
} from "./components/zen-mode-status-row";
```

Also add `Settings2` to the lucide-react import:
```tsx
import {
  Brain,
  CalendarDays,
  CheckSquare2,
  PanelsTopLeft,
  Settings2,
  Shield,
  Timer,
  Volume2,
} from "lucide-react";
```

- [ ] **Step 3: Replace ZenSessionRail with inline controls inside ZenModeShell**

In the `ZenModeShell` component, after the timer panel `motion.div` and still inside the center flex column, add inline controls:

```tsx
<div className="flex flex-col items-center gap-3 pt-4">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={onConfigure}
      className="inline-flex size-9 items-center justify-center rounded-full text-white/50 transition-opacity duration-200 hover:text-white/90"
      aria-label={configureLabel}
    >
      <Settings2 className="size-4" />
    </button>
    <button
      type="button"
      onClick={onEndZen}
      className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/50 transition-opacity duration-200 hover:text-white/90"
    >
      <Brain className="size-3.5" />
      <span>{endZenLabel}</span>
    </button>
  </div>
  <ZenModeStatusSummary items={statusItems} />
</div>
```

No frosted card, no shadow, no container — just floating controls on the wallpaper at 50% opacity.

- [ ] **Step 4: Remove the ZenSessionRail call from ZenModeShell**

Delete the `<ZenSessionRail ... />` call that was at the bottom of ZenModeShell (previously lines ~920-931).

- [ ] **Step 5: Delete the ZenSessionRail component entirely**

Remove the `ZenSessionRail` component definition (lines ~978-1020). It's no longer used anywhere.

- [ ] **Step 6: Remove `ZenModeConfigTrigger` import if no longer used**

Check if `ZenModeConfigTrigger` is still used. After removing ZenSessionRail, it's only used in `ZenLaunchRail` (the home state). If still used there, keep the import. If not, remove it.

Looking at the code: `ZenLaunchRail` at line ~969 still uses `<ZenModeConfigTrigger>`. Keep the import.

- [ ] **Step 7: Clean up unused props and labels in FocusDashboard**

In the `FocusDashboard` component, the following labels are no longer passed to any child:
- `zenActiveLabel` (was passed as `activeLabel`)
- `zenActiveSubtitle` (was passed as `activeSubtitle`)
- `activeFocusTaskEyebrow` (was passed to ZenModeShell)

Check if `activeFocusTaskEyebrow` is still used in `FocusModeShell`. Looking at the code: yes, `FocusModeShell` at line ~834 still uses it. Keep the variable but remove the two Zen-specific ones (`zenActiveLabel`, `zenActiveSubtitle`) only if they generate unused-variable warnings. Since they're `const` declarations derived from `t()`, they may cause lint warnings — remove them to keep it clean.

Remove these declarations:
```tsx
// Remove these:
const zenActiveLabel = ...
const zenActiveSubtitle = ...
```

- [ ] **Step 8: Verify build**

Run: `pnpm --filter web build && pnpm --filter extension build`
Expected: both builds succeed

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/components/core/focus-dashboard/focus-dashboard.tsx packages/shared/src/components/core/focus-dashboard/components/zen-mode-status-row.tsx
git commit -m "feat(zen-mode): replace session rail with inline controls and text summary"
```

---

## Chunk 4: Verify and polish

### Task 4: End-to-end verification

**Files:**
- Test: existing test files

- [ ] **Step 1: Run shared tests**

Run: `pnpm --filter @repo/shared test -- --run`
Expected: all tests pass

- [ ] **Step 2: Run web build**

Run: `pnpm --filter web build`
Expected: successful build

- [ ] **Step 3: Run extension build**

Run: `pnpm --filter extension build`
Expected: successful build

- [ ] **Step 4: Run git diff check**

Run: `git diff --check`
Expected: no whitespace errors
