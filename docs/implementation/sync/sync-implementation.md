# Meelio Sync Implementation

This document outlines the implementation of the sync functionality for the Meelio application.

## Architecture

The sync implementation follows the offline-first architecture described in the [Offline-First Architecture](../../Architecture/offline-first-architecture.md) document. It provides a way for clients to synchronize their local data with the server.

### Key Components

1. **Sync Module**: Located in `apps/api/src/modules/sync`
   - `sync.controller.ts`: Handles HTTP requests and responses
   - `sync.service.ts`: Contains the business logic for syncing data
   - `sync.validation.ts`: Validates incoming requests
   - `index.ts`: Exports the module components

2. **Sync Routes**: Located in `apps/api/src/routes/v1/sync.routes.ts`
   - Defines the API endpoints for syncing data

3. **Database Schema**: Defined in `apps/api/src/db/schema`
   - Each entity has a corresponding schema file

## API Endpoints

### Bulk Sync

- **URL**: `/api/v1/sync/bulk`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "operations": [
      {
        "entity": "tasks",
        "operation": "create",
        "data": { ... },
        "clientId": "client-123",
        "timestamp": "2023-01-01T00:00:00.000Z"
      }
    ],
    "lastSyncTimestamp": "2023-01-01T00:00:00.000Z"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "timestamp": "2023-01-01T00:00:00.000Z",
    "conflicts": [],
    "serverChanges": []
  }
  ```

### Sync Status

- **URL**: `/api/v1/sync/status`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
  ```

## Implementation Details

### Sync Process

1. **Client Sends Operations**: The client sends a list of operations to the server.
2. **Server Processes Operations**: The server processes each operation in order.
3. **Server Returns Changes**: The server returns any changes that have occurred since the last sync.
4. **Client Resolves Conflicts**: The client resolves any conflicts between local and server data.

### Conflict Resolution

Conflicts are detected when:
- The server cannot process an operation due to a constraint violation
- The server has a newer version of the data than the client

The server returns a list of conflicts, and the client is responsible for resolving them.

### Validation

All requests are validated using Joi schemas defined in `sync.validation.ts`. This ensures that the data is in the correct format before it is processed.

## Client Implementation

The client should implement the following:

1. **Local Storage**: Store data locally using IndexedDB
2. **Change Tracking**: Track changes to local data
3. **Sync Queue**: Maintain a queue of operations to send to the server
4. **Conflict Resolution**: Resolve conflicts between local and server data

## Testing

To test the sync functionality:

1. Start the server: `cd apps/api && npm run dev`
2. Use a tool like Postman to send requests to the API endpoints
3. Verify that the data is synchronized correctly

## Troubleshooting

Common issues:

1. **Authentication Errors**: Ensure that the client is authenticated before making requests
2. **Validation Errors**: Check that the request body is in the correct format
3. **Conflict Errors**: Resolve conflicts between local and server data

## Future Improvements

1. **Pagination**: Add pagination for large datasets
2. **Compression**: Compress data to reduce bandwidth usage
3. **Selective Sync**: Allow clients to sync only specific entities
4. **Conflict Resolution UI**: Provide a UI for resolving conflicts

## Related Documentation
- [Offline-First Architecture](../../Architecture/offline-first-architecture.md)
- [IndexedDB Schema](../../Architecture/indexeddb-schema.md)
- [Frontend Implementation Guide](../Frontend/frontend-offline-first-implementation-guide.md)
- [Sync Verification Guide](./sync-verification-guide.md)
- [Implementation Summary](../Backend/implementation-summary.md) 