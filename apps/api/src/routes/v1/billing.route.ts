import express, { Router } from 'express';

import { billingController } from '../../modules/billing/billing.controller';
import { verifySignatureMiddleware } from '../../modules/billing/billing.middleware';

const router: Router = express.Router();

router.post('/webhook', verifySignatureMiddleware(), billingController.webhook);

export default router;
