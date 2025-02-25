import { Request, Response } from "express";
import { BackgroundRepository } from "../repositories/backgroundRepository";

// Define the authenticated request type
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export class BackgroundController {
  private backgroundRepository: BackgroundRepository;

  constructor() {
    this.backgroundRepository = new BackgroundRepository();
  }

  async getBackgrounds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const backgrounds =
        await this.backgroundRepository.getBackgroundsForUser(userId);
      return res.json(backgrounds);
    } catch (error) {
      console.error("Error fetching backgrounds:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const background = await this.backgroundRepository.getBackground(
        id,
        userId
      );

      if (!background) {
        return res.status(404).json({ message: "Background not found" });
      }

      return res.json(background);
    } catch (error) {
      console.error("Error fetching background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async createBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = {
        ...req.body,
        userId,
      };

      const background = await this.backgroundRepository.createBackground(data);
      return res.status(201).json(background);
    } catch (error) {
      console.error("Error creating background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const data = req.body;

      const background = await this.backgroundRepository.updateBackground(
        id,
        userId,
        data
      );

      if (!background) {
        return res.status(404).json({ message: "Background not found" });
      }

      return res.json(background);
    } catch (error) {
      console.error("Error updating background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteBackground(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const background = await this.backgroundRepository.deleteBackground(
        id,
        userId
      );

      if (!background) {
        return res.status(404).json({ message: "Background not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting background:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
