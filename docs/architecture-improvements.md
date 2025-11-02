# Architecture Improvements Plan

## Overview

This document outlines the architectural improvements to simplify Meelio, fix breaking issues, and add missing features to match Momentum Dash functionality.

## Current Issues

### 1. Timer Architecture Issues

- **Problem**: Timer store is tightly coupled with soundscapes store
- **Impact**: Changes to timer break soundscapes functionality
- **Solution**: Decouple using event-driven architecture

### 2. Complex Sync Engine

- **Problem**: EntitySyncManager is complex and hard to debug
- **Impact**: Site blocker and other features have unpredictable sync behavior
- **Solution**: Simplify with unified feature store pattern

### 3. Missing Features

- Weather: Only current weather, no 7-day forecast
- Bookmarks/Links: Not implemented
- Tab Groups: Tab stash doesn't handle groups
- Custom Photo Upload: Not implemented
- Metrics/Countdowns: Not implemented
- Focus Mode: Mixed with timer, needs separation

## Improvement Plan

### Phase 1: Decouple Timer (Priority: HIGH)

**Goal**: Make timer changes independent of other features

**Changes**:

1. Create timer events system (start, pause, complete, etc.)
2. Soundscapes listens to timer events instead of direct calls
3. Separate timer logic from soundscapes control
4. Fix platform implementation to support both web and extension

**Files to modify**:

- `packages/shared/src/stores/timer.store.ts`
- `packages/shared/src/stores/soundscapes.store.ts`
- `packages/shared/src/lib/timer.platform.ts`
- `packages/shared/src/components/timer.tsx`

### Phase 2: Simplify Sync Engine (Priority: HIGH)

**Goal**: Make sync more predictable and easier to debug

**Changes**:

1. Create unified feature store base class/pattern
2. Simplify EntitySyncManager or create simpler alternative
3. Add better error handling and logging
4. Make sync operations more atomic

**Files to modify**:

- `packages/shared/src/utils/sync-core.ts`
- `packages/shared/src/stores/site-blocker.store.ts`
- `packages/shared/src/stores/note.store.ts`
- `packages/shared/src/stores/task.store.ts`

### Phase 3: Add Missing Features (Priority: MEDIUM)

#### 3.1 Weather Feature

- Add 7-day forecast API endpoint
- Create weather store
- Add weather component with today + forecast
- Cache weather data offline

#### 3.2 Bookmarks/Links Feature

- Integrate Chrome bookmarks API
- Create bookmarks store
- Add bookmarks UI component
- Sync bookmarks (if needed)

#### 3.3 Tab Groups Support

- Extend tab stash to handle Chrome tab groups
- Use `chrome.tabsGroups` API
- Update UI to show grouped tabs

#### 3.4 Custom Photo Upload

- Add photo upload API endpoint
- Create photos store
- Add photo selector component
- Integrate with background system

#### 3.5 Metrics/Countdowns

- Create metrics store
- Add countdown timer component
- Add analytics/metrics display

#### 3.6 Focus Mode

- Separate from timer
- Create focus mode store
- Add focus mode UI
- Integrate with site blocker

### Phase 4: Chrome Native APIs (Priority: MEDIUM)

**Goal**: Better use of Chrome APIs for better integration

**APIs to integrate**:

- `chrome.bookmarks` - For bookmarks feature
- `chrome.tabsGroups` - For tab groups
- `chrome.storage` - Already used, optimize further
- `chrome.notifications` - Improve notifications
- `chrome.alarms` - For better background tasks

## Data Flow Improvements

### Current Flow (Complex)

```
User Action → Store → Sync Manager → API → Server
                      ↓
                  Queue → Retry → Sync
```

### Improved Flow (Simple)

```
User Action → Store → Local DB → Optimistic Update
                      ↓
                  Background Sync → Server
```

## Storage Strategy

### Current

- Mixed use of localStorage, IndexedDB, Chrome storage
- Inconsistent patterns

### Improved

- **IndexedDB**: All entity data (tasks, notes, site blockers, etc.)
- **localStorage**: Simple preferences only
- **Chrome Storage**: Extension-specific settings
- **Cookies**: Session/auth only (if needed)

## Implementation Order

1. ✅ Phase 1: Decouple Timer
2. ✅ Phase 2: Simplify Sync
3. ✅ Phase 3.1: Weather Feature
4. ✅ Phase 3.2: Bookmarks/Links
5. ✅ Phase 3.3: Tab Groups
6. ✅ Phase 3.4: Custom Photo Upload
7. ✅ Phase 3.5: Metrics/Countdowns
8. ✅ Phase 3.6: Focus Mode
9. ✅ Phase 4: Chrome APIs
