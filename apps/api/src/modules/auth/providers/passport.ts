import { JwtPayload } from "jsonwebtoken";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Request } from "express";

import { config } from "@/config/config";
import { TokenType } from "@/types/enums.types";
import { userService } from "../../user";

interface IPayload extends JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  type: TokenType;
}

export const COOKIE_API_TOKEN = "api-token";

const cookieExtractor = (req: Request) => {
  console.log(JSON.stringify(req.cookies, null, 2), "req.cookies");
  return (req && req.cookies && req.cookies[COOKIE_API_TOKEN]) || null;
};

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
      if (payload.type !== TokenType.ACCESS) {
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
