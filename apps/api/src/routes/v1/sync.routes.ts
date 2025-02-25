import { Router } from "express";
import { SyncController } from "@/controllers/sync.controller";
import { auth } from "@/modules/auth";

const router = Router();
const syncController = new SyncController();

/**
 * @swagger
 * /api/v1/sync/bulk:
 *   post:
 *     summary: Bulk sync operations
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operations
 *             properties:
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *               lastSyncTimestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Sync successful
 *       401:
 *         description: Unauthorized
 */
router.post("/bulk", auth(), syncController.bulkSync.bind(syncController));

/**
 * @swagger
 * /api/v1/sync/status:
 *   get:
 *     summary: Get sync status
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current server timestamp
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/status",
  auth(),
  syncController.getSyncStatus.bind(syncController)
);

export default router;
