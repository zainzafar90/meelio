import { Router } from "express";
import { validate } from "@/common/validate";
import { auth } from "@/modules/auth";
import { syncController, syncValidation } from "@/modules/sync";

const router = Router();

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
router.post(
  "/bulk",
  auth(),
  validate(syncValidation.bulkSync),
  syncController.bulkSync
);

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
  validate(syncValidation.getSyncStatus),
  syncController.getSyncStatus
);

export default router;
