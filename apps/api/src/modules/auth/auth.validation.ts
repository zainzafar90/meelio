import Joi from "joi";

import { password } from "@/common/validate/custom.validation";
import { RegisterUserReq } from "@/types/api/api-payloads";

const registerBody: Record<keyof RegisterUserReq, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  image: Joi.string().optional(),
};

const updateAccountBody = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const register = {
  body: Joi.object().keys(registerBody),
};

const registerGuest = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const magicLinkEmail = {
  query: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const verifyMagicLink = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const verifyProvider = {
  query: Joi.object().keys({
    token: Joi.string().required(),
    provider: Joi.string().required(),
  }),
};

export const accountValidation = {
  register,
  registerGuest,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyProvider,
  magicLinkEmail,
  verifyMagicLink,
  updateAccountBody,
};
