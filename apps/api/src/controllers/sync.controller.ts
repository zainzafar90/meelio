import { Request, Response } from "express";
import { SyncService, SyncRequest } from "@/services/sync.service";

export class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService();
  }

  async bulkSync(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const syncRequest: SyncRequest = {
        userId,
        operations: req.body.operations,
        lastSyncTimestamp: req.body.lastSyncTimestamp
          ? new Date(req.body.lastSyncTimestamp)
          : undefined,
      };

      const result = await this.syncService.processSync(syncRequest);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Sync error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSyncStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Return current server timestamp for sync purposes
      return res.status(200).json({
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Get sync status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
