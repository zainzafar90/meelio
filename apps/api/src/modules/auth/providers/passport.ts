import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Request } from "express";

import { config } from "@/config/config";
import { userService } from "../../user";
import { IPayload } from "@/types/interfaces/resources";

export const COOKIE_API_TOKEN = "api-token";

const cookieExtractor = (req: Request) =>
  (req && req.cookies && req.cookies[COOKIE_API_TOKEN]) || null;

export const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromExtractors([
      cookieExtractor,
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
  },
  async (payload: IPayload, done) => {
    try {
      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }
      const user = await userService.getUserById(payload.sub);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
);
