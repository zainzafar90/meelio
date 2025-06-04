import { JwtPayload } from "jsonwebtoken";

import { RoleType } from "@/types/enums.types";

export interface IPayload extends JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  type: "access" | "refresh";
}

export type IAccessAndRefreshTokens = {
  access: {
    token: string;
    expires: Date;
  };
  refresh: {
    token: string;
    expires: Date;
  };
};

export interface IToken {
  accessToken: string;
  accessTokenExpires: Date;
  refreshToken?: string;
  refreshTokenExpires?: Date;
  provider?: string;
  providerAccountId?: string;
  idToken?: string;
  scope: string;
  userId: string;
  blacklisted?: boolean;
}

export interface IPomodoroSettings {
  workDuration: number;
  breakDuration: number;
  autoStart: boolean;
  autoBlock: boolean;
  soundOn: boolean;
  dailyFocusLimit: number;
}

export interface ITodoSettings {
  confettiOnComplete: boolean;
}

export interface IUserSettings {
  pomodoro: IPomodoroSettings;
  todo: ITodoSettings;
}

export interface IUser {
  id?: string;
  name: string;
  email?: string;
  password?: string;
  isEmailVerified: boolean;
  role: RoleType;
  image?: string;
  settings?: IUserSettings;
}

export interface IBillingWebhook {
  eventName: string;
  processed: boolean;
  eventBody: object;
  processingError: string;
}

export interface ISubscription {
  id?: string;
  lemonSqueezyId: number | string;
  subscriptionItemId?: number | string | null;
  orderId: number | string;
  name: string;
  email: string;
  status: string;
  renewsAt?: Date;
  endsAt?: Date;
  trialEndsAt?: Date;
  resumesAt?: Date;
  priceId: number | string;
  planId: number | string;
  userId: string;
  cancelled: boolean;
  productName: string;
  updatePaymentUrl?: string;
  customerPortalUrl?: string;
  isUsageBased?: boolean;
}
