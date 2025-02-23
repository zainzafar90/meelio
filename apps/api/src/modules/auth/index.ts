import * as authController from "./auth.controller";
import auth from "./auth.middleware";
import * as authService from "./auth.service";
import * as authValidation from "./auth.validation";
import { jwtStrategy } from "./providers/passport";
import { googleStrategy } from "./providers/google";

export {
  authController,
  auth,
  authService,
  authValidation,
  jwtStrategy,
  googleStrategy,
};
