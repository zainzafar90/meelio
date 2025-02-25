import { Router } from "express";
import { SoundscapeController } from "@/controllers/soundscape.controller";
import { auth } from "@/modules/auth";

const router = Router();
const soundscapeController = new SoundscapeController();

/**
 * @swagger
 * /api/v1/soundscapes:
 *   get:
 *     summary: Get all soundscapes for the user
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shareable
 *         schema:
 *           type: boolean
 *         description: Filter by shareable status
 *     responses:
 *       200:
 *         description: List of soundscapes
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  auth(),
  soundscapeController.getSoundscapes.bind(soundscapeController)
);

/**
 * @swagger
 * /api/v1/soundscapes/shared:
 *   get:
 *     summary: Get all shared soundscapes
 *     tags: [Soundscapes]
 *     responses:
 *       200:
 *         description: List of shared soundscapes
 */
router.get(
  "/shared",
  soundscapeController.getSharedSoundscapes.bind(soundscapeController)
);

/**
 * @swagger
 * /api/v1/soundscapes/{id}:
 *   get:
 *     summary: Get a specific soundscape
 *     tags: [Soundscapes]
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
 *         description: Soundscape details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Soundscape not found
 */
router.get(
  "/:id",
  auth(),
  soundscapeController.getSoundscape.bind(soundscapeController)
);

/**
 * @swagger
 * /api/v1/soundscapes:
 *   post:
 *     summary: Create a new soundscape
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sounds
 *             properties:
 *               name:
 *                 type: string
 *               sounds:
 *                 type: array
 *                 items:
 *                   type: object
 *               shareable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Soundscape created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  auth(),
  soundscapeController.createSoundscape.bind(soundscapeController)
);

/**
 * @swagger
 * /api/v1/soundscapes/{id}:
 *   put:
 *     summary: Update a soundscape
 *     tags: [Soundscapes]
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
 *               name:
 *                 type: string
 *               sounds:
 *                 type: array
 *                 items:
 *                   type: object
 *               shareable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Soundscape updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Soundscape not found
 */
router.put(
  "/:id",
  auth(),
  soundscapeController.updateSoundscape.bind(soundscapeController)
);

/**
 * @swagger
 * /api/v1/soundscapes/{id}:
 *   delete:
 *     summary: Delete a soundscape
 *     tags: [Soundscapes]
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
 *         description: Soundscape deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Soundscape not found
 */
router.delete(
  "/:id",
  auth(),
  soundscapeController.deleteSoundscape.bind(soundscapeController)
);

export default router;
