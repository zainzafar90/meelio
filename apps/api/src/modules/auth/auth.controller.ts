import { Request, Response } from "express";
import httpStatus from "http-status";

import passport from "passport";
import { IUser } from "@/types/interfaces/resources";
import { catchAsync } from "@/utils/catch-async";
import { Provider } from "@/types/enums.types";
import { ApiError } from "@/common/errors";
import { config } from "@/config/config";

import { emailService } from "../email";
import { userService } from "../user";
import { accountService } from "./auth.service";
import { cookieService } from "../cookies";
import { verificationTokenService } from "../verification-token";
import { googleAuthenticatePassport } from "./providers/google";

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.registerUser(req.body);
  const tokens = await accountService.generateAuthTokens(user as IUser);
  await accountService.updateAccountTokens(user.id, Provider.PASSWORD, tokens);
  cookieService.setResponseCookie(res, tokens);
  res.status(httpStatus.CREATED).send({ user });
});

// export const registerGuest = catchAsync(async (req: Request, res: Response) => {
//   const { name } = req.body;
//   const user = await userService.createGuestUser(name);
//   const tokens = await accountService.generateAuthTokens(user as IUser);
//   await accountService.updateAccountTokens(user.id, Provider.PASSWORD, tokens);
//   cookieService.setResponseCookie(res, tokens);
//   res.status(httpStatus.CREATED).send({ user });
// });

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await accountService.loginUserWithEmailAndPassword(
    email,
    password,
  );
  const tokens = await accountService.generateAuthTokens(user);
  await accountService.updateAccountTokens(user.id, Provider.PASSWORD, tokens);
  cookieService.setResponseCookie(res, tokens);
  res.status(httpStatus.OK).send({
    success: true,
  });
});

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const resetPasswordToken =
      await verificationTokenService.generateResetPasswordToken(req.body.email);
    await emailService.sendResetPasswordEmail(
      req.body.email,
      resetPasswordToken,
    );
    res.status(httpStatus.OK).send({
      success: true,
    });
  },
);

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await accountService.resetPassword(
    req.query["token"] as string,
    req.body.password,
  );
  res.status(httpStatus.OK).send({
    success: true,
  });
});

export const sendVerificationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const verifyEmailToken =
      await verificationTokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(
      user.email,
      verifyEmailToken,
      user.name,
    );
    res.status(httpStatus.OK).send({
      success: true,
    });
  },
);

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await accountService.verifyEmail(req.query["token"] as string);
  res.status(httpStatus.OK).send({
    success: true,
  });
});

export const sendMagicLinkEmail = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.query["email"] as string;
    const magicLinkEmailToken =
      await verificationTokenService.generateMagicLinkToken(email);
    await emailService.sendMagicLinkEmail(magicLinkEmailToken, email);
    res.status(httpStatus.OK).send({
      success: true,
    });
  },
);

export const verifyMagicLinkEmail = catchAsync(
  async (req: Request, res: Response) => {
    const user = await accountService.verifyMagicLink(
      req.query["token"] as string,
    );
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const tokens = await accountService.generateAuthTokens(user);
    await accountService.updateAccountTokens(
      user.id,
      Provider.MAGIC_LINK,
      tokens,
    );
    cookieService.setResponseCookie(res, tokens);

    res.status(httpStatus.OK).send({
      success: true,
    });
  },
);

const logout = catchAsync(async (req: Request, res: Response) => {
  const token = cookieService.getAuthCookieToken(req);
  if (token) {
    await accountService.logoutSession(token);
  }
  cookieService.clearJwtCookie(res);
  res.status(httpStatus.NO_CONTENT).send();
});

const googleAuth = (state: string) => googleAuthenticatePassport(state);

const googleAuthCallback = catchAsync(
  async (req: Request, res: Response, next: any) => {
    const state = req.query.state as string | undefined;
    const origin = state === "extension" ? "extension" : "web";

    return passport.authenticate(
      "google",
      { failureRedirect: `/v1/account/google/failure?origin=${origin}` },
      async (err: any, user: IUser) => {
        if (err) return next(err);

        const tokens = await accountService.generateAuthTokens(user);
        await accountService.updateAccountTokens(
          user.id,
          Provider.GOOGLE,
          tokens,
        );
        cookieService.setResponseCookie(res, tokens);

        const baseUrl =
          config.env === "production"
            ? config.clientUrl
            : `${config.clientUrl}`;
        const redirectUrl = new URL(baseUrl);
        if (origin === "extension") {
          redirectUrl.searchParams.set("auth_origin", origin);
        }
        return res.redirect(redirectUrl.toString());
      },
    )(req, res, next);
  },
);

const googleAuthCallbackFailure = catchAsync(
  async (req: Request, res: Response) => {
    const origin = req.query.origin || "web";
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Login Error",
      details: `Something went wrong when you tried to log in just now (Origin: ${origin}). Please try again later. If you're experiencing a critical issue, please email support@meelio.io`,
    });
  },
);

const googleAuthCallbackSuccess = catchAsync(
  async (req: Request, res: Response) => {
    const origin = req.query.origin || "web";
    return res.status(httpStatus.OK).json({
      message: `Login Success (Origin: ${origin})`,
    });
  },
);

const getAccount = catchAsync(async (req: Request, res: Response) => {
  const apiToken = cookieService.getAuthCookieToken(req);

  const account = await accountService.getUserAccount(apiToken);
  if (!account) {
    return res.status(httpStatus.NOT_FOUND).send({
      message: "User not found",
    });
  }

  return res.send({
    ...account.user,
    isPro: account.isPro,
    subscriptionId: account.subscriptionId,
  });
});

const updateAccount = catchAsync(async (req: Request, res: Response) => {
  const apiToken = cookieService.getAuthCookieToken(req);

  const account = await accountService.updateUserAccount(apiToken, req.body);
  if (!account) {
    return res.status(httpStatus.NOT_FOUND).send({
      message: "User not found",
    });
  }

  return res.send({
    ...account.user,
    isPro: account.isPro,
    subscriptionId: account.subscriptionId,
  });
});

export const accountController = {
  googleAuth,
  googleAuthCallback,
  googleAuthCallbackFailure,
  googleAuthCallbackSuccess,
  getAccount,
  updateAccount,
  logout,
  register,
  // registerGuest,
  login,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendMagicLinkEmail,
  verifyMagicLinkEmail,
};
