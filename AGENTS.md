# Coding Standards for AI Agents

This document outlines the coding standards and guidelines that AI agents should follow when working on this codebase.

## Code Style Guidelines

### 1. No Comments

- **Never leave comments in code**
- Code should be self-documenting through clear naming and structure
- If code needs explanation, refactor it to be clearer instead

### 2. Functional Approach

- **Always use a functional programming approach**
- Prefer pure functions over imperative code
- Use function composition over nested conditionals
- Avoid side effects when possible
- Use immutability principles

### 3. Never Use `let`

- **Never use `let` for variable declarations**
- Always use `const` instead
- If mutation is needed, create new structures rather than mutating existing ones
- Use functional patterns like `map`, `filter`, `reduce` instead of loops with `let`

### 4. Never Use Classes

- **Never use classes**
- Use functions, objects, and closures instead
- Prefer composition over inheritance
- Use factory functions or closures for encapsulation
- Use functional modules instead of class-based modules

### 5. Easy to Follow Code and Flow

- **Prioritize readability and clarity**
- Use descriptive function and variable names
- Break complex logic into smaller, composable functions
- Maintain a clear, linear flow of data
- Avoid deep nesting (prefer early returns, guard clauses)
- Group related functionality together
- Use consistent patterns throughout the codebase

## Examples

### ❌ Bad (uses `let`, class, comments)

```typescript
// This function calculates the total
class Calculator {
  // Initialize the calculator
  calculate(items: Item[]) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += items[i].price;
    }
    return total;
  }
}
```

### ✅ Good (functional, `const`, no comments)

```typescript
const calculateTotal = (items: Item[]): number =>
  items.reduce((total, item) => total + item.price, 0);
```

### ❌ Bad (uses `let`, comments)

```typescript
function processUsers(users) {
  // Filter active users
  let activeUsers = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].isActive) {
      activeUsers.push(users[i]);
    }
  }
  return activeUsers;
}
```

### ✅ Good (functional, `const`)

```typescript
const processUsers = (users: User[]): User[] =>
  users.filter((user) => user.isActive);
```

## Best Practices

1. **Keep functions small and focused** - Single responsibility principle
2. **Prefer arrow functions** - Cleaner syntax for functional code
3. **Use destructuring** - Makes code more readable
4. **Use type inference where possible** - Let TypeScript infer types
5. **Avoid mutations** - Create new objects/arrays instead
6. **Use early returns** - Reduce nesting and improve readability
7. **Compose functions** - Build complex behavior from simple functions

## TypeScript Specifics

- Prefer `const` assertions for immutable data
- Use type inference where it improves readability
- Prefer `type` over `interface` for functional code (unless extending)
- Use utility types (`Pick`, `Omit`, `Partial`, etc.) for transformations
- Avoid `any` - use `unknown` if type is truly unknown

## When to Refactor Existing Code

If you encounter code that violates these standards:

1. Refactor it to follow these guidelines
2. Do this incrementally - one function/module at a time
3. Maintain existing functionality during refactoring
4. Update related code to match the new patterns

## Architecture Improvements Plan

This section outlines the architectural improvements to simplify Meelio, fix breaking issues, and add missing features to match Momentum Dash functionality.

### Current Issues

#### 1. Timer Architecture Issues

- **Problem**: Timer store is tightly coupled with soundscapes store
- **Impact**: Changes to timer break soundscapes functionality
- **Solution**: Decouple using event-driven architecture

#### 2. Complex Sync Engine

- **Problem**: EntitySyncManager is complex and hard to debug
- **Impact**: Site blocker and other features have unpredictable sync behavior
- **Solution**: Simplify with unified feature store pattern

#### 3. Missing Features

- Weather: Only current weather, no 7-day forecast
- Bookmarks/Links: Not implemented
- Tab Groups: Tab stash doesn't handle groups
- Custom Photo Upload: Not implemented
- Metrics/Countdowns: Not implemented
- Focus Mode: Mixed with timer, needs separation

### Improvement Plan

#### Phase 1: Decouple Timer (Priority: HIGH) ✅

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

#### Phase 2: Simplify Sync Engine (Priority: HIGH)

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

#### Phase 3: Add Missing Features (Priority: MEDIUM)

##### 3.1 Weather Feature

- Add 7-day forecast API endpoint
- Create weather store
- Add weather component with today + forecast
- Cache weather data offline

##### 3.2 Bookmarks/Links Feature

- Integrate Chrome bookmarks API
- Create bookmarks store
- Add bookmarks UI component
- Sync bookmarks (if needed)

##### 3.3 Tab Groups Support

- Extend tab stash to handle Chrome tab groups
- Use `chrome.tabsGroups` API
- Update UI to show grouped tabs

##### 3.4 Custom Photo Upload

- Add photo upload API endpoint
- Create photos store
- Add photo selector component
- Integrate with background system

##### 3.5 Metrics/Countdowns

- Create metrics store
- Add countdown timer component
- Add analytics/metrics display

##### 3.6 Focus Mode

- Separate from timer
- Create focus mode store
- Add focus mode UI
- Integrate with site blocker

#### Phase 4: Chrome Native APIs (Priority: MEDIUM)

**Goal**: Better use of Chrome APIs for better integration

**APIs to integrate**:

- `chrome.bookmarks` - For bookmarks feature
- `chrome.tabsGroups` - For tab groups
- `chrome.storage` - Already used, optimize further
- `chrome.notifications` - Improve notifications
- `chrome.alarms` - For better background tasks

### Data Flow Improvements

**Current Flow (Complex)**:

```
User Action → Store → Sync Manager → API → Server
                      ↓
                  Queue → Retry → Sync
```

**Improved Flow (Simple)**:

```
User Action → Store → Local DB → Optimistic Update
                      ↓
                  Background Sync → Server
```

### Storage Strategy

**Current**:

- Mixed use of localStorage, IndexedDB, Chrome storage
- Inconsistent patterns

**Improved**:

- **IndexedDB**: All entity data (tasks, notes, site blockers, etc.)
- **localStorage**: Simple preferences only
- **Chrome Storage**: Extension-specific settings
- **Cookies**: Session/auth only (if needed)

### Implementation Status

1. ✅ Phase 1: Decouple Timer - Complete (event-driven architecture, timer events system)
2. ✅ Phase 2: Simplify Sync - Complete (created functional sync-manager.ts, removed class-based approach)
3. ⏳ Phase 3.1: Weather Feature - In Progress (needs backend API endpoint for 7-day forecast)
4. ✅ Phase 3.2: Bookmarks/Links - Complete (Chrome bookmarks API, offline-first with IndexedDB caching, dock integration)
5. ⏳ Phase 3.3: Tab Groups - Pending (extend tab stash with chrome.tabsGroups)
6. ⏳ Phase 3.4: Custom Photo Upload - Pending (needs backend API)
7. ⏳ Phase 3.5: Metrics/Countdowns - Pending (frontend-only feature)
8. ⏳ Phase 3.6: Focus Mode - Pending (separate from timer, integrate with site blocker)
9. ⏳ Phase 4: Chrome APIs - Pending (bookmarks, tabsGroups, notifications, alarms)
