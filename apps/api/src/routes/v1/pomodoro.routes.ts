import { Router } from "express";
import { validate } from "@/common/validate";
import { auth } from "@/modules/auth";
import { pomodoroController, pomodoroValidation } from "@/modules/pomodoro";

const router = Router();

/**
 * @swagger
 * /api/v1/pomodoro:
 *   get:
 *     summary: Get pomodoro settings for the authenticated user
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pomodoro settings
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth(), pomodoroController.getPomodoroSettings);

/**
 * @swagger
 * /api/v1/pomodoro:
 *   post:
 *     summary: Create or update pomodoro settings for the authenticated user
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workDuration
 *               - breakDuration
 *             properties:
 *               workDuration:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *               breakDuration:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *               autoStart:
 *                 type: boolean
 *               autoBlock:
 *                 type: boolean
 *               soundOn:
 *                 type: boolean
 *               dailyFocusLimit:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
 *     responses:
 *       200:
 *         description: Pomodoro settings updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  auth(),
  validate(pomodoroValidation.createPomodoroSettings),
  pomodoroController.updatePomodoroSettings
);

/**
 * @swagger
 * /api/v1/pomodoro:
 *   put:
 *     summary: Update pomodoro settings for the authenticated user
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workDuration:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *               breakDuration:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *               autoStart:
 *                 type: boolean
 *               autoBlock:
 *                 type: boolean
 *               soundOn:
 *                 type: boolean
 *               dailyFocusLimit:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
 *     responses:
 *       200:
 *         description: Pomodoro settings updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/",
  auth(),
  validate(pomodoroValidation.updatePomodoroSettings),
  pomodoroController.updatePomodoroSettings
);

export default router;
