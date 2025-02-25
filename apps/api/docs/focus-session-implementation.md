# Focus Session Implementation

This document outlines the implementation of the focus session functionality for the Meelio application.

## Overview

Focus sessions are time periods during which users engage in focused work. The focus session module allows users to track their focus time, providing insights into their productivity patterns.

## Database Schema

The focus session schema is defined in `apps/api/src/db/schema/focus-session.schema.ts`:

```typescript
export const focusSessions = pgTable(
  "focus_sessions",
  {
    id,
    userId: text("user_id").notNull(),
    sessionStart: timestamp("session_start", { withTimezone: true }).notNull(),
    sessionEnd: timestamp("session_end", { withTimezone: true }).notNull(),
    duration: integer("duration").notNull(), // duration in minutes
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_focus_sessions_user_id").on(table.userId),
    sessionStartIdx: index("idx_focus_sessions_start").on(table.sessionStart),
    sessionEndIdx: index("idx_focus_sessions_end").on(table.sessionEnd),
  })
);
```

## API Endpoints

### Get Focus Sessions

- **URL**: `/api/v1/focus-sessions`
- **Method**: `GET`
- **Authentication**: Required
- **Description**: Retrieves all focus sessions for the authenticated user
- **Response**: Array of focus session objects

### Get Focus Session by ID

- **URL**: `/api/v1/focus-sessions/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Description**: Retrieves a specific focus session by ID
- **Response**: Focus session object

### Create Focus Session

- **URL**: `/api/v1/focus-sessions`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "sessionStart": "2023-01-01T00:00:00.000Z",
    "sessionEnd": "2023-01-01T01:00:00.000Z",
    "duration": 60
  }
  ```
- **Description**: Creates a new focus session
- **Response**: Created focus session object

### Update Focus Session

- **URL**: `/api/v1/focus-sessions/:id`
- **Method**: `PATCH`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "sessionStart": "2023-01-01T00:00:00.000Z",
    "sessionEnd": "2023-01-01T01:30:00.000Z",
    "duration": 90
  }
  ```
- **Description**: Updates an existing focus session
- **Response**: Updated focus session object

### Delete Focus Session

- **URL**: `/api/v1/focus-sessions/:id`
- **Method**: `DELETE`
- **Authentication**: Required
- **Description**: Deletes a focus session
- **Response**: No content (204)

## Implementation Details

### Module Structure

The focus session module is organized as follows:

- `focus-session.validation.ts`: Defines validation schemas for requests
- `focus-session.service.ts`: Contains business logic for focus sessions
- `focus-session.controller.ts`: Handles HTTP requests and responses
- `focus-session.routes.ts`: Defines API routes
- `index.ts`: Exports module components

### Validation

Focus session requests are validated using Joi schemas:

- `createFocusSession`: Validates creation requests
- `updateFocusSession`: Validates update requests

### Service Functions

- `getFocusSessions`: Retrieves all focus sessions for a user
- `getFocusSessionById`: Gets a specific focus session
- `createFocusSession`: Creates a new focus session
- `updateFocusSession`: Updates an existing focus session
- `deleteFocusSession`: Deletes a focus session

### Controller Functions

- `getFocusSessions`: Handles GET requests for all focus sessions
- `getFocusSession`: Handles GET requests for a specific focus session
- `createFocusSession`: Handles POST requests to create focus sessions
- `updateFocusSession`: Handles PATCH requests to update focus sessions
- `deleteFocusSession`: Handles DELETE requests to remove focus sessions

## Offline Support

Focus sessions support offline-first functionality:

1. Sessions are stored locally in IndexedDB when created offline
2. When connectivity is restored, sessions are synced with the server
3. Conflicts are resolved based on timestamp and user preference

## Premium Features

Premium users have access to:

- Unlimited focus session history
- Advanced analytics and insights
- Detailed reports and visualizations

Free users have limited focus session storage and basic analytics.

## Integration with Other Modules

Focus sessions integrate with:

- Pomodoro module: Focus sessions can be automatically created from pomodoro sessions
- Task module: Focus sessions can be associated with specific tasks
- Analytics: Focus data contributes to productivity insights 