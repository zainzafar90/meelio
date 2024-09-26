import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";

import ExpressMongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import passport from "passport";
import httpStatus from "http-status";
import cookieParser from "cookie-parser";
import config from "./config/config";
import { authLimiter } from "./modules/utils";
import { ApiError, errorConverter, errorHandler } from "./modules/errors";
import { jwtStrategy } from "./modules/account/providers/passport";
import routes from "./routes/v1";
import { googleStrategy } from "./modules/account/providers/google";

export type RequestWithRawBody = express.Request & { rawBody: Buffer };

export const createServer = (): Express => {
  const corsOptions = {
    origin:
      config.env === "production"
        ? config.clientUrl
        : `http://${config.clientUrl}`,
    credentials: true,
  };

  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(
      json({
        verify: (req, _, buf) => {
          (req as RequestWithRawBody).rawBody = buf;
        },
      })
    )
    .use(urlencoded({ extended: true }))
    .use(cors(corsOptions))
    .options("*", cors(corsOptions))
    .use(cookieParser())
    .use(passport.initialize())
    .use(ExpressMongoSanitize())
    .use(compression())
    .use("/v1", routes)
    .get("/", (_, res) => {
      res.status(200).json({ message: "Meelio API" });
    })
    .use((req, res, next) => {
      next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
    })
    .use(errorConverter)
    .use(errorHandler);

  passport.use("jwt", jwtStrategy);
  passport.use("google", googleStrategy);

  if (config.env === "production") {
    app.use("/v1/account", authLimiter);
  }

  app.enable("trust proxy");

  app.use((req, res, next) => {
    if (config.env !== "development") {
      authLimiter(req, res, next);
    } else {
      next();
    }
  });

  return app;
};

// export const createServer = (): Express => {
//   const app = express();
//   app
//     .disable("x-powered-by")
//     .use(morgan("dev"))
//     .use(urlencoded({ extended: true }))
//     .use(json())
//     .use(cors())
//     .get("/message/:name", (req, res) => {
//       return res.json({ message: `hello ${req.params.name}` });
//     })
//     .get("/status", (_, res) => {
//       return res.json({ ok: true });
//     });

//   return app;
// };
