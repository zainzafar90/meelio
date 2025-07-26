# Product Requirements Document: Site Blocker Enhancement

## Executive Summary
Enhance the Meelio site blocker feature to properly sync blocking state between the API and browser extension, introducing a boolean `isBlocked` field for explicit blocking control.

## Problem Statement
The current site blocker implementation has several limitations:
1. Sites are stored in the database but lack an explicit blocking state
2. The extension manages blocking state locally without syncing with the API
3. Users cannot toggle sites between blocked/unblocked without deleting them
4. No persistence of blocking preferences across devices/sessions

## Proposed Solution
Add an `isBlocked` boolean field to the site blocker schema and implement proper state synchronization between the API and extension.

## User Stories
1. **As a user**, I want to toggle sites between blocked and unblocked states without losing my site list
2. **As a user**, I want my blocking preferences to persist across browser sessions and devices
3. **As a user**, I want to temporarily unblock a site without removing it from my blocklist
4. **As a user**, I want to see which sites are currently active vs inactive in my blocklist

## Technical Requirements

### Database Schema Changes
```typescript
// Add to site_blockers table
isBlocked: boolean("is_blocked").notNull().default(true)
```

### API Enhancements

#### 1. Update Site Blocker Service
- Modify `createSiteBlocker` to set `isBlocked: true` by default
- Add toggle endpoint: `PUT /api/site-blockers/:id/toggle`
- Include `isBlocked` in all responses
- Support filtering by `isBlocked` status in `getSiteBlockers`

#### 2. New Endpoints
```typescript
// Toggle blocking state
PUT /api/site-blockers/:id/toggle
Response: { ...siteBlocker, isBlocked: !previousState }

// Bulk operations
PUT /api/site-blockers/bulk-toggle
Body: { ids: string[], isBlocked: boolean }
```

### Extension Changes

#### 1. Storage Structure Update
```typescript
interface SiteBlockState {
  id: string;
  url: string;
  isBlocked: boolean; // New field
  blocked: boolean; // Deprecated, for backward compatibility
  streak: number;
  createdAt: number;
}
```

#### 2. Sync Logic
- Fetch site blockers from API on extension load
- Update local storage with API data
- Sync `isBlocked` state changes to API
- Handle offline mode with queue for pending updates

#### 3. UI Changes
- Show toggle switch for each blocked site
- Visual distinction between active/inactive blocks
- "Temporarily allow" becomes a toggle action

## Implementation Plan

### Phase 1: API Updates (Week 1)
1. Database migration to add `isBlocked` field
2. Update service layer to handle new field
3. Add toggle endpoints
4. Update validation schemas

### Phase 2: Extension Integration (Week 2)
1. Update storage interfaces
2. Implement API sync logic
3. Add offline queue handling
4. Update blocker component logic

### Phase 3: UI Enhancements (Week 3)
1. Add toggle UI in extension popup
2. Update blocker overlay with state info
3. Add bulk management features
4. Improve visual feedback

## Success Metrics
- 100% of blocked sites properly sync between API and extension
- < 500ms latency for toggle operations
- 0% data loss during offline/online transitions
- 90% user satisfaction with toggle functionality

## Migration Strategy
1. Deploy API changes with backward compatibility
2. Extension update maintains existing local data
3. Background sync migrates local-only blocks to API
4. Gradual deprecation of `blocked` field in favor of `isBlocked`

## Technical Considerations

### Content Script Initialization
**Why users need to open a site once after enabling blocking:**

The site blocker works through a content script that runs on web pages. When a user adds a site to the blocklist or toggles blocking on:

1. **Content scripts only run on page load** - The extension's content script (`content.tsx`) runs at `document_start` and checks if the current site should be blocked
2. **No retroactive injection** - Chrome doesn't inject content scripts into already-open tabs when permissions change or when sites are added to the blocklist
3. **Storage updates don't trigger reloads** - While the blocked sites list is updated in Chrome storage immediately, existing tabs won't check this until they're refreshed

**Current behavior:**
- When a site is added to blocklist: Storage is updated but open tabs remain unblocked
- User must navigate to the site (or refresh if already there) for the blocker overlay to appear
- This is a browser limitation, not a bug in the implementation

**Potential solutions:**
1. Show a notification asking users to refresh blocked sites after adding them
2. Implement a background script that uses the Chrome tabs API to automatically refresh matching tabs
3. Add clear messaging in the UI explaining that sites will be blocked on next visit

## Future Considerations
- Schedule-based blocking (e.g., block during work hours)
- Category-based bulk toggles
- Blocking intensity levels (soft block with timer vs hard block)
- Cross-browser sync via user accounts