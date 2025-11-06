import Joi from "joi";

import "dotenv/config";

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .required(),
    PORT: Joi.number().default(3000),
    DB_URL: Joi.string().required().description("Database url"),
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(30)
      .description("minutes after which access tokens expire"),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description("days after which refresh tokens expire"),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description("minutes after which reset password token expires"),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description("minutes after which verify email token expires"),
    SMTP_HOST: Joi.string().description("server that will send the emails"),
    SMTP_PORT: Joi.number().description("port to connect to the email server"),
    SMTP_USERNAME: Joi.string().description("username for email server"),
    SMTP_PASSWORD: Joi.string().description("password for email server"),
    EMAIL_FROM: Joi.string().description(
      "the from field in the emails sent by the app"
    ),
    GOOGLE_CLIENT_ID: Joi.string().required().description("Google client id"),
    GOOGLE_CLIENT_SECRET: Joi.string()
      .required()
      .description("Google client secret"),
    LEMON_SQUEEZY_SIGNING_SECRET: Joi.string()
      .required()
      .description("Lemon Squeezy signing secret"),
    LEMON_SQUEEZY_API_KEY: Joi.string()
      .required()
      .description("Lemon Squeezy API key"),
    LEMON_SQUEEZY_STORE_ID: Joi.string()
      .required()
      .description("Lemon Squeezy store id"),
    ACCUWEATHER_API_KEY: Joi.string()
      .description("AccuWeather API key"),
    CLIENT_URL: Joi.string().required().description("Client url"),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  db: {
    url: envVars.DB_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === "production",
      signed: true,
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
  },
  billing: {
    signingSecret: envVars.LEMON_SQUEEZY_SIGNING_SECRET,
    apiKey: envVars.LEMON_SQUEEZY_API_KEY,
    storeId: envVars.LEMON_SQUEEZY_STORE_ID,
  },
  accuWeather: {
    apiKey: envVars.ACCUWEATHER_API_KEY,
  },
  clientUrl: envVars.CLIENT_URL,
};

export { config };
