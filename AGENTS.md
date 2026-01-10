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

## Architecture Notes

### Data Storage (Offline-First)

All data is stored locally - there is no backend server:

- **IndexedDB (via Dexie)**: Primary storage for all user data
- **localStorage**: Zustand store persistence for preferences
- **Chrome Storage**: Extension-specific settings

### Adding New Features

1. Add Dexie table in `packages/shared/src/lib/db/meelio.dexie.ts` if data persistence needed
2. Create Zustand store in `packages/shared/src/stores/`
3. Add components to `packages/shared/src/components/`
4. Use IndexedDB for data, localStorage for preferences

### Feature Implementation Status

1. ✅ Timer: Event-driven architecture with soundscapes integration
2. ✅ Weather: 7-day forecast with offline caching
3. ✅ Bookmarks: Chrome bookmarks API with IndexedDB caching
4. ✅ Tab Groups: Tab stash with chrome.tabsGroups support
5. ✅ Soundscapes: Progressive download with IndexedDB caching
6. ✅ Notes: Local storage with Dexie
7. ✅ Tasks: Local storage with Dexie
8. ✅ Site Blocker: Local storage with Dexie
