import { Document, Model } from 'mongoose';

export interface IVerificationToken {
  email: string;
  token: string;
  type: string;
  expires: Date;
  blacklisted: boolean;
}

export interface IVerificationTokenDoc extends IVerificationToken, Document {}

export interface IVerificationTokenModel extends Model<IVerificationTokenDoc> {}
