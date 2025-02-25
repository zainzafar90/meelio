import { Request, Response } from "express";
import { db } from "@/db";
import { soundscapes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export class SoundscapeController {
  async getSoundscapes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get query parameters for filtering
      const { shareable } = req.query;

      // Build the query conditions
      const conditions = [eq(soundscapes.userId, userId)];

      // Add shareable filter if provided
      if (shareable !== undefined) {
        const isShareable = shareable === "true";
        conditions.push(eq(soundscapes.shareable, isShareable));
      }

      // Execute the query with all conditions
      const result = await db
        .select()
        .from(soundscapes)
        .where(and(...conditions));

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching soundscapes:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSoundscape(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Soundscape ID is required" });
      }

      const result = await db
        .select()
        .from(soundscapes)
        .where(and(eq(soundscapes.id, id), eq(soundscapes.userId, userId)));

      if (result.length === 0) {
        return res.status(404).json({ message: "Soundscape not found" });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error fetching soundscape:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async createSoundscape(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, config, shareable } = req.body;
      if (!name) {
        return res.status(400).json({
          message: "Name is required",
        });
      }

      // Insert soundscape
      const insertData = {
        userId,
        name,
        config: config || undefined,
        shareable: shareable || false,
      };

      const result = await db
        .insert(soundscapes)
        .values(insertData)
        .returning();

      return res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating soundscape:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateSoundscape(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Soundscape ID is required" });
      }

      const { name, config, shareable } = req.body;
      if (!name && config === undefined && shareable === undefined) {
        return res.status(400).json({
          message: "At least one field to update is required",
        });
      }

      // Check if soundscape exists and belongs to user
      const existingSoundscape = await db
        .select()
        .from(soundscapes)
        .where(and(eq(soundscapes.id, id), eq(soundscapes.userId, userId)));

      if (existingSoundscape.length === 0) {
        return res.status(404).json({ message: "Soundscape not found" });
      }

      // Update soundscape
      const updateData = {};

      if (name) {
        Object.assign(updateData, { name });
      }

      if (config !== undefined) {
        Object.assign(updateData, { config });
      }

      if (shareable !== undefined) {
        Object.assign(updateData, { shareable });
      }

      const result = await db
        .update(soundscapes)
        .set(updateData)
        .where(and(eq(soundscapes.id, id), eq(soundscapes.userId, userId)))
        .returning();

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error updating soundscape:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteSoundscape(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Soundscape ID is required" });
      }

      // Check if soundscape exists and belongs to user
      const existingSoundscape = await db
        .select()
        .from(soundscapes)
        .where(and(eq(soundscapes.id, id), eq(soundscapes.userId, userId)));

      if (existingSoundscape.length === 0) {
        return res.status(404).json({ message: "Soundscape not found" });
      }

      // Delete soundscape
      await db
        .delete(soundscapes)
        .where(and(eq(soundscapes.id, id), eq(soundscapes.userId, userId)));

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting soundscape:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSharedSoundscapes(req: Request, res: Response) {
    try {
      // Get public soundscapes
      const result = await db
        .select()
        .from(soundscapes)
        .where(eq(soundscapes.shareable, true));

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching shared soundscapes:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
