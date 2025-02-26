# Meelio Documentation

## Architecture & Design
- [Frontend Offline-First Architecture](./Architecture/frontend-offline-first-architecture.md) - Core architecture design for offline-first functionality
- [Offline-First Architecture](./Architecture/offline-first-architecture.md) - Overall system architecture for offline capabilities
- [IndexedDB Schema](./Architecture/indexeddb-schema.md) - Database schema for client-side storage

## Implementation Guides
### Frontend
- [Frontend Offline-First Implementation Guide](./Implementation/Frontend/frontend-offline-first-implementation-guide.md) - Detailed guide for implementing offline-first features
- [Frontend Offline-First Implementation Plan](./Implementation/Frontend/frontend-offline-first-implementation-plan.md) - Step-by-step plan for frontend implementation
- [Chrome Extension Implementation](./Implementation/Frontend/chrome-extension-implementation.md) - Guide for Chrome extension features

### Backend
- [Focus Session Implementation](./Implementation/Backend/focus-session-implementation.md) - Implementation details for focus session feature
- [Implementation Summary](./Implementation/Backend/implementation-summary.md) - Overview of implemented features and components

### Sync & Data Management
- [Sync Implementation](./Implementation/Sync/sync-implementation.md) - Core sync mechanism implementation
- [Sync Verification Guide](./Implementation/Sync/sync-verification-guide.md) - Guide for verifying sync functionality

## Module Organization
- [Module Standardization Plan](./Module/module-standardization-plan.md) - Plan for standardizing module structure
- [Module Analysis](./Module/analyze-modules.js) - Script for analyzing module patterns

## Documentation Structure
```
docs/
├── Architecture/              # System architecture documents
├── Implementation/           # Implementation guides and plans
│   ├── Frontend/            # Frontend-specific guides
│   ├── Backend/             # Backend-specific guides
│   └── Sync/                # Sync-related documentation
└── Module/                  # Module organization and standards
```

## Documentation Standards
1. Each document should:
   - Begin with a clear purpose statement
   - Include a table of contents for documents > 100 lines
   - Use consistent markdown formatting
   - Include relevant code examples where needed

2. Naming conventions:
   - Use kebab-case for filenames
   - End all docs with `.md` extension
   - Use descriptive, feature-focused names

3. Organization:
   - Keep related documents together
   - Cross-reference related docs using relative links
   - Maintain a clear hierarchy of information

## Contributing
When adding new documentation:
1. Update this README.md with the new document
2. Follow the established structure and standards
3. Include necessary cross-references
4. Update any related implementation guides 