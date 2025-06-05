import express from "express";
import auth from "@/modules/auth/auth.middleware";
import {
  MemoryTokenStore,
  MemoryStateStore,
  calendarController,
} from "@/modules/google-calendar";

const router = express.Router();
const controller = calendarController({
  tokenStore: new MemoryTokenStore(),
  stateStore: new MemoryStateStore(),
  fetcher: fetch,
  now: Date.now,
});

router.post("/oauth/google/start", auth(), controller.startOAuth);
router.get("/oauth/google/callback", controller.handleCallback);
router.get("/token", auth(), controller.getToken);

export default router;
