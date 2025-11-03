import { JwtPayload } from "jsonwebtoken";

import { RoleType } from "@/types/enums.types";

export interface IPayload extends JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  type: "access" | "refresh";
  sessionId?: string;
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

export interface ISession {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  accessTokenExpires: Date | null;
  refreshToken: string | null;
  refreshTokenExpires: Date | null;
  deviceInfo: string | null;
  blacklisted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPomodoroSettings {
  workDuration: number;
  breakDuration: number;
  autoStart: boolean;
  autoBlock: boolean;
  soundOn: boolean;
  dailyFocusLimit: number;
}

export interface ITaskSettings {
  confettiOnComplete: boolean;
}

export interface ICalendarSettings {
  enabled: boolean;
}

export interface IWeatherSettings {
  locationKey?: string;
  locationName?: string;
}

export interface IUserSettings {
  pomodoro: IPomodoroSettings;
  onboardingCompleted: boolean;
  task: ITaskSettings;
  calendar: ICalendarSettings;
  weather?: IWeatherSettings;
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
