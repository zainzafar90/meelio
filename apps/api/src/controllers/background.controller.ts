import { Request, Response } from "express";
import { db } from "@/db";
import {
  backgrounds,
  BackgroundType,
  type BackgroundInsert,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export class BackgroundController {
  async getBackgrounds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await db
        .select()
        .from(backgrounds)
        .where(eq(backgrounds.userId, userId));

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching backgrounds:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Background ID is required" });
      }

      const result = await db
        .select()
        .from(backgrounds)
        .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)));

      if (result.length === 0) {
        return res.status(404).json({ message: "Background not found" });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error fetching background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async createBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { type, url, schedule } = req.body;
      if (!type || !url) {
        return res.status(400).json({ message: "Type and URL are required" });
      }

      // Validate type
      if (!Object.values(BackgroundType).includes(type)) {
        return res.status(400).json({
          message: `Type must be one of: ${Object.values(BackgroundType).join(", ")}`,
        });
      }

      // Insert background
      const insertData = {
        userId,
        type: type as BackgroundType,
        url,
        ...(schedule && { schedule }),
      };

      const result = await db
        .insert(backgrounds)
        .values(insertData)
        .returning();

      return res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Background ID is required" });
      }

      const { type, url, schedule } = req.body;
      if (!type && !url && schedule === undefined) {
        return res
          .status(400)
          .json({ message: "At least one field to update is required" });
      }

      // Validate type if provided
      if (type && !Object.values(BackgroundType).includes(type)) {
        return res.status(400).json({
          message: `Type must be one of: ${Object.values(BackgroundType).join(", ")}`,
        });
      }

      // Check if background exists and belongs to user
      const existingBackground = await db
        .select()
        .from(backgrounds)
        .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)));

      if (existingBackground.length === 0) {
        return res.status(404).json({ message: "Background not found" });
      }

      // Update background
      const updateData = {};

      if (type) {
        Object.assign(updateData, { type: type as BackgroundType });
      }

      if (url) {
        Object.assign(updateData, { url });
      }

      if (schedule !== undefined) {
        Object.assign(updateData, { schedule });
      }

      const result = await db
        .update(backgrounds)
        .set(updateData)
        .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)))
        .returning();

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error updating background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Background ID is required" });
      }

      // Check if background exists and belongs to user
      const existingBackground = await db
        .select()
        .from(backgrounds)
        .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)));

      if (existingBackground.length === 0) {
        return res.status(404).json({ message: "Background not found" });
      }

      // Delete background
      await db
        .delete(backgrounds)
        .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)));

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
