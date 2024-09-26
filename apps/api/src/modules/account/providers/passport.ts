import { Request } from 'express';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import config from '../../../config/config';
import User from '../../user/user.model';
import { COOKIE_API_TOKEN } from '../../cookies/cookie.service';
import { IPayload } from '../account.interfaces';
import { TokenType } from '../../verification-token/verification-token.types';

const cookieExtractor = (req: Request) => (req && req.cookies && req.cookies[COOKIE_API_TOKEN]) || null;

export const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
  },
  async (payload: IPayload, done) => {
    try {
      if (payload.type !== TokenType.ACCESS) {
        throw new Error('Invalid token type');
      }
      const user = await User.findById(payload.sub);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
);
