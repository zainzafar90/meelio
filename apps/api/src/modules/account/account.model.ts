import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import { IAccountDoc, IAccountModel } from './account.interfaces';
import { Provider } from './providers/provider.interfaces';

const accountSchema = new mongoose.Schema<IAccountDoc, IAccountModel>(
  {
    provider: {
      type: String,
      allowNull: false,
      enum: [Provider.GOOGLE, Provider.PASSWORD, Provider.MAGIC_LINK],
    },
    providerAccountId: {
      type: String,
      allowNull: true,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    accessToken: {
      type: String,
      required: false,
    },
    accessTokenExpires: {
      type: Date,
      required: false,
    },
    refreshToken: {
      type: String,
      required: false,
    },
    refreshTokenExpires: {
      type: Date,
      required: false,
    },
    idToken: {
      type: String,
    },
    scope: {
      type: String,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
accountSchema.plugin(toJSON);

const Account = mongoose.model<IAccountDoc, IAccountModel>('Account', accountSchema);

export default Account;
