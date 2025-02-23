import { RoleType } from "@/types/role.types";

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

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  isEmailVerified: boolean;
  role: RoleType;
  image?: string;
}
