import { Request, Response } from "express";
import { db } from "@/db";
import { mantras, MantraType } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export class MantraController {
  async getMantras(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get query parameters for filtering
      const { type, date } = req.query;

      // Build the query conditions
      const conditions = [eq(mantras.userId, userId)];

      // Add type filter if provided
      if (type && Object.values(MantraType).includes(type as MantraType)) {
        conditions.push(eq(mantras.type, type as MantraType));
      }

      // Add date filter if provided
      if (date) {
        try {
          const dateObj = new Date(date as string);
          conditions.push(eq(mantras.date, dateObj));
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }

      // Execute the query with all conditions
      const result = await db
        .select()
        .from(mantras)
        .where(and(...conditions))
        .orderBy(desc(mantras.date));

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching mantras:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getMantra(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Mantra ID is required" });
      }

      const result = await db
        .select()
        .from(mantras)
        .where(and(eq(mantras.id, id), eq(mantras.userId, userId)));

      if (result.length === 0) {
        return res.status(404).json({ message: "Mantra not found" });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error fetching mantra:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getDailyMantra(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get today's date (UTC)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // First check if user has a custom mantra for today
      const customMantra = await db
        .select()
        .from(mantras)
        .where(
          and(
            eq(mantras.userId, userId),
            eq(mantras.type, MantraType.CUSTOM),
            eq(mantras.date, today)
          )
        );

      if (customMantra.length > 0) {
        return res.status(200).json(customMantra[0]);
      }

      // If no custom mantra, get a global mantra for today
      const globalMantra = await db
        .select()
        .from(mantras)
        .where(
          and(eq(mantras.type, MantraType.GLOBAL), eq(mantras.date, today))
        );

      if (globalMantra.length > 0) {
        return res.status(200).json(globalMantra[0]);
      }

      // If no mantra for today, return the most recent global mantra
      const recentGlobalMantra = await db
        .select()
        .from(mantras)
        .where(eq(mantras.type, MantraType.GLOBAL))
        .orderBy(desc(mantras.date))
        .limit(1);

      if (recentGlobalMantra.length > 0) {
        return res.status(200).json(recentGlobalMantra[0]);
      }

      return res.status(404).json({ message: "No mantra found" });
    } catch (error) {
      console.error("Error fetching daily mantra:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async createMantra(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { text, type, date } = req.body;
      if (!text) {
        return res.status(400).json({
          message: "Text is required",
        });
      }

      // Validate type
      if (!type || !Object.values(MantraType).includes(type)) {
        return res.status(400).json({
          message: `Type must be one of: ${Object.values(MantraType).join(", ")}`,
        });
      }

      // Only admins can create global mantras
      if (type === MantraType.GLOBAL && userId !== "admin@meelio.com") {
        return res.status(403).json({
          message: "Only admins can create global mantras",
        });
      }

      // Parse date if provided
      let dateObj;
      if (date) {
        try {
          dateObj = new Date(date);
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }

      // Insert mantra
      const insertData = {
        userId,
        text,
        type: type as MantraType,
        date: dateObj,
      };

      const result = await db.insert(mantras).values(insertData).returning();

      return res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating mantra:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateMantra(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Mantra ID is required" });
      }

      const { text, type, date } = req.body;
      if (!text && !type && !date) {
        return res.status(400).json({
          message: "At least one field to update is required",
        });
      }

      // Validate type if provided
      if (type && !Object.values(MantraType).includes(type)) {
        return res.status(400).json({
          message: `Type must be one of: ${Object.values(MantraType).join(", ")}`,
        });
      }

      // Only admins can update to global type
      if (type === MantraType.GLOBAL && userId !== "admin@meelio.com") {
        return res.status(403).json({
          message: "Only admins can create global mantras",
        });
      }

      // Check if mantra exists and belongs to user
      const existingMantra = await db
        .select()
        .from(mantras)
        .where(and(eq(mantras.id, id), eq(mantras.userId, userId)));

      if (existingMantra.length === 0) {
        return res.status(404).json({ message: "Mantra not found" });
      }

      // Parse date if provided
      let dateObj;
      if (date) {
        try {
          dateObj = new Date(date);
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }

      // Update mantra
      const updateData = {};

      if (text) {
        Object.assign(updateData, { text });
      }

      if (type) {
        Object.assign(updateData, { type: type as MantraType });
      }

      if (date) {
        Object.assign(updateData, { date: dateObj });
      }

      const result = await db
        .update(mantras)
        .set(updateData)
        .where(and(eq(mantras.id, id), eq(mantras.userId, userId)))
        .returning();

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error updating mantra:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteMantra(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Mantra ID is required" });
      }

      // Check if mantra exists and belongs to user
      const existingMantra = await db
        .select()
        .from(mantras)
        .where(and(eq(mantras.id, id), eq(mantras.userId, userId)));

      if (existingMantra.length === 0) {
        return res.status(404).json({ message: "Mantra not found" });
      }

      // Only admins can delete global mantras
      if (
        existingMantra[0].type === MantraType.GLOBAL &&
        userId !== "admin@meelio.com"
      ) {
        return res.status(403).json({
          message: "Only admins can delete global mantras",
        });
      }

      // Delete mantra
      await db
        .delete(mantras)
        .where(and(eq(mantras.id, id), eq(mantras.userId, userId)));

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting mantra:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getGlobalMantras(req: Request, res: Response) {
    try {
      // Get global mantras
      const result = await db
        .select()
        .from(mantras)
        .where(eq(mantras.type, MantraType.GLOBAL))
        .orderBy(desc(mantras.date));

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching global mantras:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
