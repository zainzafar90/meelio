import { Router } from "express";
import { auth } from "@/modules/auth";
import { calendarController } from "@/modules/calendar";

const router = Router();

router.get("/authorize", auth(), calendarController.authorize);
router.get("/callback", auth(), calendarController.callback);
router.get("/events", auth(), calendarController.getNextEvent);
router.delete("/", auth(), calendarController.revoke);

export default router;
