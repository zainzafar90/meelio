# Meelio Documentation

This folder contains documentation for the Meelio application, focusing on architecture, implementation details, and development guides.

## Offline-First Implementation

The Meelio application follows an offline-first architecture, allowing users to continue using the application even when offline. Data is synchronized with the server when connectivity is restored.

### Key Documents

- [Frontend Offline-First Implementation Plan](./frontend-offline-first-implementation-plan.md): A checklist of tasks for implementing offline-first capabilities in the frontend applications.
- [Frontend Offline-First Architecture](./frontend-offline-first-architecture.md): Detailed architecture and implementation guide for the frontend offline-first approach.

### Backend Documentation

The backend implementation details can be found in the `apps/api/docs` folder:

- [Offline-First Architecture](../apps/api/docs/offline-first-architecture.md): Overview of the offline-first architecture.
- [IndexedDB Schema](../apps/api/docs/indexeddb-schema.md): Details of the IndexedDB schema used for local storage.
- [Sync Implementation](../apps/api/docs/sync-implementation.md): Implementation details for the sync mechanism.
- [Sync Verification Guide](../apps/api/docs/sync-verification-guide.md): Guide for verifying the sync functionality.
- [Implementation Summary](../apps/api/docs/implementation-summary.md): Summary of the implementation approach.
- [Chrome Extension Implementation](../apps/api/docs/chrome-extension-implementation.md): Implementation details for the Chrome extension.
- [Focus Session Implementation](../apps/api/docs/focus-session-implementation.md): Implementation details for focus sessions.

## Development Process

When implementing new features or making changes to the codebase, follow these steps:

1. Review the relevant documentation to understand the architecture and implementation details.
2. Check the implementation plan to see what tasks need to be completed.
3. Mark tasks as completed in the implementation plan as you progress.
4. Update the documentation as needed to reflect changes or new insights.
5. Add new documentation for new features or significant changes.

## Contributing to Documentation

When contributing to the documentation:

1. Use Markdown for all documentation files.
2. Include code examples where appropriate.
3. Keep the documentation up-to-date with the codebase.
4. Use diagrams to illustrate complex concepts (ASCII diagrams are preferred for version control compatibility).
5. Link to related documentation to help readers navigate the documentation. 