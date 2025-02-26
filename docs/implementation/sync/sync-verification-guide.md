# Meelio Sync Verification Guide

This document provides a guide for verifying the sync implementation for the Meelio application.

## Prerequisites

1. Running API server (`cd apps/api && npm run dev`)
2. Postman or similar API testing tool
3. Access to a database client for PostgreSQL

## Testing the Sync API

### 1. Authentication

Before testing the sync API, you need to authenticate:

1. Send a POST request to `/api/v1/account/login` with:
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
2. Save the authentication cookie for subsequent requests

### 2. Get Sync Status

1. Send a GET request to `/api/v1/sync/status` with the authentication cookie
2. Verify that the response includes a `timestamp` field
3. Save this timestamp for the next test

### 3. Create Data

Create some test data to sync:

1. Send a POST request to `/api/v1/pomodoro` with:
   ```json
   {
     "workDuration": 30,
     "breakDuration": 5,
     "autoStart": true,
     "soundOn": true
   }
   ```
2. Verify that the response includes the created pomodoro settings

### 4. Bulk Sync

1. Send a POST request to `/api/v1/sync/bulk` with:
   ```json
   {
     "operations": [
       {
         "entity": "tasks",
         "operation": "create",
         "data": {
           "title": "Test Task",
           "description": "This is a test task for sync",
           "status": "pending"
         },
         "clientId": "test-client",
         "timestamp": "2023-01-01T00:00:00.000Z"
       }
     ],
     "lastSyncTimestamp": "2023-01-01T00:00:00.000Z"
   }
   ```
2. Verify that the response includes:
   - `success: true`
   - `timestamp` field
   - `conflicts` array (should be empty)
   - `serverChanges` array (may include the pomodoro settings created earlier)

### 5. Verify Data in Database

1. Connect to the PostgreSQL database
2. Query the `tasks` table:
   ```sql
   SELECT * FROM tasks WHERE title = 'Test Task';
   ```
3. Verify that the task was created with the correct data

### 6. Test Conflict Resolution

1. Send a POST request to `/api/v1/sync/bulk` with an operation that will cause a conflict:
   ```json
   {
     "operations": [
       {
         "entity": "tasks",
         "operation": "update",
         "data": {
           "id": "non-existent-id",
           "title": "Updated Task"
         },
         "clientId": "test-client",
         "timestamp": "2023-01-01T00:00:00.000Z"
       }
     ],
     "lastSyncTimestamp": "2023-01-01T00:00:00.000Z"
   }
   ```
2. Verify that the response includes:
   - `success: false`
   - `conflicts` array with the operation that caused the conflict

## Testing with Chrome Extension

### 1. Configure Extension

1. Create a `.env` file in the extension directory with:
   ```
   PLASMO_PUBLIC_SERVER_URL=http://localhost:3000
   PLASMO_PUBLIC_DEV=true
   ```
2. Run the extension in development mode: `cd apps/extension && npm run dev`

### 2. Test Authentication

1. Open the extension in Chrome
2. Log in with valid credentials
3. Verify that the authentication is successful

### 3. Test Offline Capabilities

1. Disconnect from the network
2. Create a new task in the extension
3. Verify that the task is saved locally
4. Reconnect to the network
5. Verify that the task is synced to the server

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check that the authentication cookie is included in the requests
   - Verify that the user exists in the database

2. **Sync Errors**:
   - Check the server logs for error messages
   - Verify that the entity exists in the database schema
   - Check that the operation is valid (create, update, delete)

3. **Database Errors**:
   - Check that the database is running
   - Verify that the schema is up to date
   - Check for constraint violations

### Debugging Tips

1. Enable debug logging in the server:
   ```
   DEBUG=meelio:* npm run dev
   ```

2. Use the browser's developer tools to inspect network requests and IndexedDB storage

3. Add console.log statements to the sync service to track the flow of operations

## Conclusion

By following this guide, you should be able to verify that the sync implementation is working correctly. If you encounter any issues, refer to the troubleshooting section or check the server logs for more information.

## Related Documentation
- [Sync Implementation](./sync-implementation.md)
- [Offline-First Architecture](../../Architecture/offline-first-architecture.md)
- [Frontend Implementation Guide](../Frontend/frontend-offline-first-implementation-guide.md)
- [Implementation Summary](../Backend/implementation-summary.md) 