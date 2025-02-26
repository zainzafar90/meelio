# Note Module Conversion Example

This document demonstrates how to convert the `note` module from function-based exports to object-based exports.

## Current Structure

The note module currently has the following structure:

```
note/
├── index.ts
├── note.controller.ts
├── note.routes.ts
├── note.service.ts
└── note.validation.ts
```

With function-based exports:

```typescript
// note.controller.ts
export const getNotes = catchAsync(async (req, res) => { ... });
export const getNote = catchAsync(async (req, res) => { ... });
// ...

// note.service.ts
export const getNotes = async (userId) => { ... };
export const getNoteById = async (id, userId) => { ... };
// ...
```

## Step 1: Convert Controller

### Before:

```typescript
import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import * as noteService from "./note.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get notes for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getNotes = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const notes = await noteService.getNotes(userId);
    return res.status(httpStatus.OK).json(notes);
  }
);

// Other functions...
```

### After:

```typescript
import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { noteService } from "./note.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const noteController = {
  /**
   * Get notes for the authenticated user
   */
  getNotes: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message: "Unauthorized",
        });
      }

      const notes = await noteService.getNotes(userId);
      return res.status(httpStatus.OK).json(notes);
    }
  ),

  // Other methods...
};
```

## Step 2: Convert Service

### Before:

```typescript
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

/**
 * Get notes for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object[]>} The notes
 */
export const getNotes = async (userId: string) => {
  return await db.select().from(notes).where(eq(notes.userId, userId));
};

// Other functions...
```

### After:

```typescript
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export const noteService = {
  /**
   * Get notes for a user
   */
  getNotes: async (userId: string) => {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  },

  // Other methods...
};
```

## Step 3: Update Validation

### Before:

```typescript
import Joi from "joi";

export const createNote = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
  }),
};

export const updateNote = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    title: Joi.string().optional(),
    content: Joi.string().optional(),
  }),
};
```

### After:

```typescript
import Joi from "joi";

export const noteValidation = {
  createNote: {
    body: Joi.object().keys({
      title: Joi.string().required(),
      content: Joi.string().required(),
    }),
  },

  updateNote: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      title: Joi.string().optional(),
      content: Joi.string().optional(),
    }),
  },
};
```

## Step 4: Update Index File

### Before:

```typescript
import * as noteController from "./note.controller";
import * as noteService from "./note.service";
import { noteValidation } from "./note.validation";

export { noteController, noteService, noteValidation };
```

### After:

```typescript
export * from "./note.controller";
export * from "./note.service";
export * from "./note.validation";
```

## Step 5: Move Routes to Central Directory

### Before (note.routes.ts):

```typescript
import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { noteController } from "./index";
import { noteValidation } from "./note.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), noteController.getNotes)
  .post(auth(), validate(noteValidation.createNote), noteController.createNote);

router
  .route("/:id")
  .get(auth(), noteController.getNote)
  .patch(auth(), validate(noteValidation.updateNote), noteController.updateNote)
  .delete(auth(), noteController.deleteNote);

export default router;
```

### After (apps/api/src/routes/v1/note.routes.ts):

```typescript
import { Router } from "express";
import { auth } from "@/modules/auth";
import {
  noteController,
  noteValidation,
} from "@/modules/note";
import { validate } from "@/common/validate";

const router = Router();

router.get("/", auth(), noteController.getNotes);

router.post(
  "/",
  auth(),
  validate(noteValidation.createNote),
  noteController.createNote
);

router.get(
  "/:id",
  auth(),
  validate(noteValidation.getNote),
  noteController.getNote
);

router.patch(
  "/:id",
  auth(),
  validate(noteValidation.updateNote),
  noteController.updateNote
);

router.delete(
  "/:id",
  auth(),
  noteController.deleteNote
);

export default router;
```

## Step 6: Update Main Routes File

In `apps/api/src/routes/v1/index.ts`, ensure the note routes are properly imported:

```typescript
import noteRoutes from "./note.routes";

// ...

router.use("/notes", noteRoutes);
```

## Testing

After completing the conversion, test all endpoints to ensure they work as expected:

1. GET /api/v1/notes
2. GET /api/v1/notes/:id
3. POST /api/v1/notes
4. PATCH /api/v1/notes/:id
5. DELETE /api/v1/notes/:id

## Benefits

This conversion:

## Conversion Checklist

When converting a module, follow these steps:

1. [ ] Convert controller to object-based pattern
2. [ ] Convert service to object-based pattern
3. [ ] Update or create validation file with object-based pattern
4. [ ] Update index.ts to use export * pattern
5. [ ] If module has internal routes, move to central routes directory
6. [ ] Update imports in routes file to use module index
7. [ ] Remove Swagger/JSDoc comments
8. [ ] Update documentation 