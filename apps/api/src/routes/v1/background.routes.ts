import { Router } from "express";
import { auth } from "@/modules/auth";
import { backgroundController } from "@/modules/background";

const router = Router();

/**
 * @swagger
 * /api/v1/backgrounds:
 *   get:
 *     summary: Get all backgrounds for the user
 *     tags: [Backgrounds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of backgrounds
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  auth(),
  backgroundController.getBackgrounds.bind(backgroundController)
);

/**
 * @swagger
 * /api/v1/backgrounds/{id}:
 *   get:
 *     summary: Get a specific background
 *     tags: [Backgrounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Background details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Background not found
 */
router.get(
  "/:id",
  auth(),
  backgroundController.getBackgroundById.bind(backgroundController)
);

/**
 * @swagger
 * /api/v1/backgrounds:
 *   post:
 *     summary: Create a new background
 *     tags: [Backgrounds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - url
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [static, live]
 *               url:
 *                 type: string
 *               schedule:
 *                 type: object
 *     responses:
 *       201:
 *         description: Background created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  auth(),
  backgroundController.createBackground.bind(backgroundController)
);

/**
 * @swagger
 * /api/v1/backgrounds/{id}:
 *   put:
 *     summary: Update a background
 *     tags: [Backgrounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [static, live]
 *               url:
 *                 type: string
 *               schedule:
 *                 type: object
 *     responses:
 *       200:
 *         description: Background updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Background not found
 */
router.put(
  "/:id",
  auth(),
  backgroundController.updateBackground.bind(backgroundController)
);

/**
 * @swagger
 * /api/v1/backgrounds/{id}:
 *   delete:
 *     summary: Delete a background
 *     tags: [Backgrounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Background deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Background not found
 */
router.delete(
  "/:id",
  auth(),
  backgroundController.deleteBackground.bind(backgroundController)
);

export default router;
