import httpStatus from "http-status";
import { Request, Response } from "express";
import passport from "passport";
import catchAsync from "../utils/catchAsync";
import ApiError from "../errors/ApiError";
import { cookieService } from "../cookies";
import { accountService } from "./account.service";

import config from "../../config/config";
import { IUserDoc } from "../user/user.interfaces";
import { googleAuthenticatePassport } from "./providers/google";
import { userService } from "../user";
import { verificationTokenService } from "../verification-token/verification-token.service";
import { emailService } from "../email";
import { Provider } from "./providers/provider.interfaces";

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.registerUser(req.body);
  const tokens = await accountService.generateAuthTokens(user);
  await accountService.updateAccountTokens(user.id, Provider.PASSWORD, tokens);
  cookieService.setResponseCookie(res, tokens);
  res.status(httpStatus.CREATED).send({ user });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await accountService.loginUserWithEmailAndPassword(
    email,
    password
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
      resetPasswordToken
    );
    res.status(httpStatus.OK).send({
      success: true,
    });
  }
);

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await accountService.resetPassword(
    req.query["token"] as string,
    req.body.password
  );
  res.status(httpStatus.OK).send({
    success: true,
  });
});

export const sendVerificationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const verifyEmailToken =
      await verificationTokenService.generateVerifyEmailToken(req.user);
    await emailService.sendVerificationEmail(
      req.user.email,
      verifyEmailToken,
      req.user.name
    );
    res.status(httpStatus.OK).send({
      success: true,
    });
  }
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
  }
);

export const verifyMagicLinkEmail = catchAsync(
  async (req: Request, res: Response) => {
    const user = await accountService.verifyMagicLink(
      req.query["token"] as string
    );
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const tokens = await accountService.generateAuthTokens(user);
    await accountService.updateAccountTokens(
      user.id,
      Provider.MAGIC_LINK,
      tokens
    );
    cookieService.setResponseCookie(res, tokens);

    res.status(httpStatus.OK).send({
      success: true,
    });
  }
);

const logout = catchAsync(async (_req: Request, res: Response) => {
  cookieService.clearJwtCookie(res);
  res.status(httpStatus.NO_CONTENT).send();
});

const googleAuth = googleAuthenticatePassport;

const googleAuthCallback = catchAsync(
  async (req: Request, res: Response, next: any) => {
    return passport.authenticate("google", async (err: any, user: IUserDoc) => {
      if (err) return next(err);
      if (!user) res.redirect("/v1/account/google/failure");

      const tokens = await accountService.generateAuthTokens(user);
      await accountService.updateAccountTokens(
        user.id,
        Provider.GOOGLE,
        tokens
      );
      cookieService.setResponseCookie(res, tokens);
      const redirectCallbackURL =
        config.env === "production"
          ? config.clientUrl
          : `http://${config.clientUrl}`;
      return res.redirect(redirectCallbackURL);
    })(req, res, next);
  }
);

const googleAuthCallbackFailure = catchAsync(
  async (_: Request, res: Response) => {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Login Error",
      details: `Something went wrong when you tried to log in just now. Please try again later. If you're experiencing a critical issue, please email support@meelio.io`,
    });
  }
);

const googleAuthCallbackSuccess = catchAsync(
  async (_: Request, res: Response) => {
    return res.status(httpStatus.OK).json({
      message: "Login Success",
    });
  }
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
  login,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendMagicLinkEmail,
  verifyMagicLinkEmail,
};
