# Meelio Offline-First Architecture

This document outlines the architecture for implementing offline-first capabilities in the Meelio application.

## Core Principles

1. **Local-First Data**: All data is stored locally first, then synced to the server when online.
2. **Optimistic UI**: UI updates immediately based on local changes, without waiting for server confirmation.
3. **Background Sync**: Data synchronizes automatically when connectivity is restored.
4. **Conflict Resolution**: Clear strategies for handling conflicts between local and server data.
5. **Seamless Experience**: Users should not notice a difference in functionality when offline.

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Interface │◄────┤  Data Repository│◄────┤  API Service    │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │                 │              │
         └──────────────┤  IndexedDB      ├──────────────┘
                        │                 │
                        └─────────────────┘
```

## IndexedDB Schema

The IndexedDB database will mirror our PostgreSQL schema with additional fields for sync status:

- `_syncStatus`: Enum ('synced', 'pending', 'conflict')
- `_lastModified`: Timestamp of the last local modification
- `_serverVersion`: Version from the server (for conflict detection)

## Sync Process

1. **Change Detection**:
   - Track changes to local data with timestamps
   - Maintain a queue of pending changes

2. **Sync Initiation**:
   - Automatic sync when online
   - Manual sync option for users
   - Periodic sync attempts in the background

3. **Bulk Operations**:
   - Group changes by entity type
   - Send batched requests to reduce API calls
   - Process responses to update local sync status

4. **Conflict Resolution**:
   - Server-wins: Server data overrides local (default)
   - Client-wins: Local data overrides server
   - Merge: Combine data based on field-level rules
   - Manual: Prompt user to resolve conflicts

## Network Status Handling

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Online Mode    │────►│  Offline Mode   │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
        ▲                       │
        │                       │
        └───────────────────────┘
```

- **Online Detection**: Use browser's `navigator.onLine` and connectivity checks
- **Offline Mode**: Automatically switch to offline mode when connectivity is lost
- **Sync Queue**: Maintain a queue of operations to perform when back online
- **Retry Strategy**: Implement exponential backoff for sync attempts

## API Endpoints for Sync

- `POST /api/v1/sync/bulk`: Process multiple operations in a single request
- `GET /api/v1/sync/status`: Get sync status and server timestamps
- `POST /api/v1/sync/resolve`: Resolve conflicts with server data

## Chrome Extension Considerations

- Use Chrome's `storage.local` API for persistent storage
- Implement a similar sync mechanism with the main API
- Handle background sync using Chrome's background scripts
- Manage storage limits according to Chrome's quotas

## Performance Considerations

- Implement pagination for initial data load
- Use compression for bulk sync operations
- Implement selective sync for large data types (like backgrounds)
- Cache frequently accessed data for quick access

## Security Considerations

- Encrypt sensitive data in local storage
- Implement proper authentication for sync operations
- Handle token expiration and refresh during offline periods
- Validate data integrity during sync

## Premium vs Free Features

- Free users: Limited storage and sync frequency
- Premium users: Unlimited storage and priority sync
- Feature flags to control access to premium features
- Graceful degradation for free users when limits are reached 