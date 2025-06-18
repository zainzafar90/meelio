import express from "express";
import { calendarController } from "@/modules/calendar";
import auth from "@/modules/auth/auth.middleware";

const router = express.Router();

router.get("/auth", auth(), calendarController.authorize);
router.get("/callback", calendarController.callback);

export default router;