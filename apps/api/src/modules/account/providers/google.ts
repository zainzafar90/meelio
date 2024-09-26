import passport from 'passport';
import {
  GoogleCallbackParameters,
  Strategy as GoogleStrategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';

import config from '../../../config/config';
import User from '../../user/user.model';
import Account from '../account.model';
import { IUserDoc } from '../../user/user.interfaces';
import { Provider } from './provider.interfaces';
import { userService } from '../../user';

const isProduction = config.env === 'production';

const googleOptions: StrategyOptions = {
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: isProduction ? 'https://api.meelio.io/v1/account/callback/google' : '/v1/account/callback/google',
};

function extractGoogleProfileData(profile: passport.Profile) {
  if (!profile) {
    throw new Error('Profile is not provided.');
  }

  const profileId = profile.id ? profile.id : null;
  const name = profile.displayName ? profile.displayName : null;
  const email = profile.emails && profile.emails.length && profile.emails[0]?.value ? profile.emails[0].value : null;
  const image = profile.photos && profile.photos.length && profile.photos[0]?.value ? profile.photos[0].value : null;

  return {
    profileId,
    name,
    email,
    image,
  };
}

const googleVerify = async (
  _accessToken: string,
  _refreshToken: string,
  params: GoogleCallbackParameters,
  profile: passport.Profile,
  done: VerifyCallback
) => {
  const { profileId, name, email, image } = extractGoogleProfileData(profile);
  try {
    const account = await Account.findOne({
      providerAccountId: profile.id,
      provider: Provider.GOOGLE,
    });

    if (!account) {
      let user = await userService.getUserByEmail(email!);

      if (!user) {
        // User does not exist, so create a new user
        user = new User({
          name,
          email,
          image,
        });
        await user.save();
      } else {
        user = await userService.updateUserById(user.id, {
          name: name!,
          image: image!,
        });
      }

      // Create a new account linking to the existing or new user
      const newAccount = new Account({
        providerAccountId: profileId,
        provider: Provider.GOOGLE,
        userId: user.id,
        idToken: params.id_token,
        scope: params.scope,
      });

      await newAccount.save();

      done(null, user);
    } else {
      // Account exists, find the associated user
      const user = await User.findById(account.userId);
      if (!user) {
        throw new Error('User associated with the account is not found');
      }

      done(null, user);
    }
  } catch (error) {
    return done(error as any, undefined);
  }
};

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    if (user) {
      done(null, user as IUserDoc);
    }
  } catch (error) {
    done(error, null);
  }
});

const googleStrategy = new GoogleStrategy(googleOptions, googleVerify);
const googleAuthenticatePassport = passport.authenticate('google', {
  scope: ['profile', 'email', 'openid'],
  accessType: 'offline',
  prompt: 'consent',
});

export { googleStrategy, googleAuthenticatePassport };
