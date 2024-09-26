import { JwtPayload } from 'jsonwebtoken';
import { Document, Model } from 'mongoose';

export interface IAccount {
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

export interface IAccountDoc extends IAccount, Document {}

export interface IAccountModel extends Model<IAccountDoc> {}

export interface AccountTokenPayload {
  token: string;
  expires: Date;
}

export interface AccountTokens {
  access: AccountTokenPayload;
  refresh: AccountTokenPayload;
}

export interface IPayload extends JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  type: string;
}
