import express, { Router } from "express";

import {
  billingController,
  verifySignatureMiddleware,
} from "@/modules/billing";

const router: Router = express.Router();

router.post("/webhook", verifySignatureMiddleware(), billingController.webhook);

export default router;
