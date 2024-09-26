import mongoose from 'mongoose';
import validator from 'validator';
import { TokenType } from './verification-token.types';
import toJSON from '../toJSON/toJSON';
import { IVerificationTokenDoc, IVerificationTokenModel } from './verification-token.interfaces';

const verificationTokenSchema = new mongoose.Schema<IVerificationTokenDoc, IVerificationTokenModel>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [TokenType.RESET_PASSWORD, TokenType.VERIFY_EMAIL, TokenType.MAGIC_LINK],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'verification-tokens',
  }
);

// add plugin that converts mongoose to json
verificationTokenSchema.plugin(toJSON);

const VerificationToken = mongoose.model<IVerificationTokenDoc, IVerificationTokenModel>(
  'VerificationToken',
  verificationTokenSchema
);

export default VerificationToken;
