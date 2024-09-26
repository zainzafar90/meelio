import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import config from "../../config/config";
import { RequestWithRawBody } from "../../server";

export const verifySignatureMiddleware =
  () => (req: Request, _: Response, next: NextFunction) =>
    new Promise<void>((resolve, reject) => {
      try {
        const { secret } = config.billing;
        const hmac = crypto.createHmac("sha256", secret);
        const digest = Buffer.from(
          hmac.update((req as RequestWithRawBody).rawBody).digest("hex"),
          "utf8"
        );
        const signature = Buffer.from(req.get("X-Signature") || "", "utf8");

        if (!signature || !crypto.timingSafeEqual(digest, signature)) {
          reject(new Error("Invalid signature."));
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    })
      .then(() => next())
      .catch((err) => next(err));
