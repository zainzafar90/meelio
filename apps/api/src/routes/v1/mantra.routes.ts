import { Router } from "express";
import { MantraController } from "@/controllers/mantra.controller";
import { auth } from "@/modules/auth";

const router = Router();
const mantraController = new MantraController();

/**
 * @swagger
 * /api/v1/mantras:
 *   get:
 *     summary: Get all mantras for the user
 *     tags: [Mantras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [custom, global]
 *         description: Filter by mantra type
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (ISO format)
 *     responses:
 *       200:
 *         description: List of mantras
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth(), mantraController.getMantras.bind(mantraController));

/**
 * @swagger
 * /api/v1/mantras/daily:
 *   get:
 *     summary: Get the daily mantra for the user
 *     tags: [Mantras]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily mantra
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No mantra found
 */
router.get(
  "/daily",
  auth(),
  mantraController.getDailyMantra.bind(mantraController)
);

/**
 * @swagger
 * /api/v1/mantras/global:
 *   get:
 *     summary: Get all global mantras
 *     tags: [Mantras]
 *     responses:
 *       200:
 *         description: List of global mantras
 */
router.get("/global", mantraController.getGlobalMantras.bind(mantraController));

/**
 * @swagger
 * /api/v1/mantras/{id}:
 *   get:
 *     summary: Get a specific mantra
 *     tags: [Mantras]
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
 *         description: Mantra details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Mantra not found
 */
router.get("/:id", auth(), mantraController.getMantra.bind(mantraController));

/**
 * @swagger
 * /api/v1/mantras:
 *   post:
 *     summary: Create a new mantra
 *     tags: [Mantras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - type
 *             properties:
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [custom, global]
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Mantra created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (for global mantras)
 */
router.post("/", auth(), mantraController.createMantra.bind(mantraController));

/**
 * @swagger
 * /api/v1/mantras/{id}:
 *   put:
 *     summary: Update a mantra
 *     tags: [Mantras]
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
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [custom, global]
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Mantra updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (for global mantras)
 *       404:
 *         description: Mantra not found
 */
router.put(
  "/:id",
  auth(),
  mantraController.updateMantra.bind(mantraController)
);

/**
 * @swagger
 * /api/v1/mantras/{id}:
 *   delete:
 *     summary: Delete a mantra
 *     tags: [Mantras]
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
 *         description: Mantra deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (for global mantras)
 *       404:
 *         description: Mantra not found
 */
router.delete(
  "/:id",
  auth(),
  mantraController.deleteMantra.bind(mantraController)
);

export default router;
