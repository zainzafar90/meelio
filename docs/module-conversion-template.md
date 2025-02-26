# Module Conversion Template

This document provides templates for converting modules to the standardized object-based pattern.

## Controller Template

```typescript
import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { moduleService } from "./module.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const moduleController = {
  /**
   * Get all resources
   */
  getResources: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      const resources = await moduleService.getResources(userId);
      return res.status(httpStatus.OK).json(resources);
    }
  ),

  /**
   * Get a resource by ID
   */
  getResourceById: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      const { id } = req.params;
      const resource = await moduleService.getResourceById(id, userId);
      
      if (!resource) {
        return res.status(httpStatus.NOT_FOUND).json({
          message: "Resource not found",
        });
      }

      return res.status(httpStatus.OK).json(resource);
    }
  ),

  /**
   * Create a new resource
   */
  createResource: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      const resource = await moduleService.createResource(userId, req.body);
      return res.status(httpStatus.CREATED).json(resource);
    }
  ),

  /**
   * Update a resource
   */
  updateResource: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      const { id } = req.params;
      const resource = await moduleService.updateResource(id, userId, req.body);
      return res.status(httpStatus.OK).json(resource);
    }
  ),

  /**
   * Delete a resource
   */
  deleteResource: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      const { id } = req.params;
      await moduleService.deleteResource(id, userId);
      return res.status(httpStatus.NO_CONTENT).send();
    }
  ),
};
```

## Service Template

```typescript
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export const moduleService = {
  /**
   * Get all resources for a user
   */
  getResources: async (userId: string) => {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.userId, userId));
  },

  /**
   * Get a resource by ID
   */
  getResourceById: async (id: string, userId: string) => {
    const result = await db
      .select()
      .from(resources)
      .where(and(eq(resources.id, id), eq(resources.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  },

  /**
   * Create a resource
   */
  createResource: async (userId: string, data: any) => {
    const result = await db
      .insert(resources)
      .values({
        userId,
        // Add other fields from data
      })
      .returning();

    return result[0];
  },

  /**
   * Update a resource
   */
  updateResource: async (id: string, userId: string, data: any) => {
    const result = await db
      .update(resources)
      .set({
        // Add fields from data
        updatedAt: new Date(),
      })
      .where(and(eq(resources.id, id), eq(resources.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Resource not found");
    }

    return result[0];
  },

  /**
   * Delete a resource
   */
  deleteResource: async (id: string, userId: string) => {
    const result = await db
      .delete(resources)
      .where(and(eq(resources.id, id), eq(resources.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Resource not found");
    }

    return result[0];
  },
};
```

## Validation Template

```typescript
import Joi from "joi";

export const moduleValidation = {
  createResource: {
    body: Joi.object().keys({
      // Define validation schema for creation
      field1: Joi.string().required(),
      field2: Joi.number().optional(),
    }),
  },

  updateResource: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      // Define validation schema for updates
      field1: Joi.string().optional(),
      field2: Joi.number().optional(),
    }),
  },

  getResource: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  },

  deleteResource: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  },
};
```

## Index Template

```typescript
export * from "./module.controller";
export * from "./module.service";
export * from "./module.validation";
```

## Routes Template (for central routes directory)

```typescript
import { Router } from "express";
import { auth } from "@/modules/auth";
import {
  moduleController,
  moduleValidation,
} from "@/modules/module";
import { validate } from "@/common/validate";

const router = Router();

router.get("/", auth(), moduleController.getResources);

router.get(
  "/:id",
  auth(),
  validate(moduleValidation.getResource),
  moduleController.getResourceById
);

router.post(
  "/",
  auth(),
  validate(moduleValidation.createResource),
  moduleController.createResource
);

router.put(
  "/:id",
  auth(),
  validate(moduleValidation.updateResource),
  moduleController.updateResource
);

router.delete(
  "/:id",
  auth(),
  validate(moduleValidation.deleteResource),
  moduleController.deleteResource
);

export default router;
```

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