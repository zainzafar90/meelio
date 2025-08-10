import { NextFunction, Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";

import { ApiError } from "@/common/errors/api-error";
import { subscriptionService } from "@/modules/subscription/subscription.service";

/**
 * Middleware to enforce Pro subscription for protected routes
 */
export const requirePro = (): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const email = (req.user as any)?.email as string | undefined;
      if (!email) {
        return next(new ApiError(httpStatus.FORBIDDEN, "Pro subscription required"));
      }

      const subscription = await subscriptionService.getSubscriptionByEmail(email);
      if (!subscription) {
        return next(new ApiError(httpStatus.FORBIDDEN, "Pro subscription required"));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default requirePro;

