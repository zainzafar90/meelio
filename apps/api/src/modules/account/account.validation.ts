import Joi from 'joi';
import { password } from '../validate/custom.validation';
import { NewRegisteredUser } from '../user/user.interfaces';

const registerBody: Record<keyof NewRegisteredUser, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
};

const updateAccountBody = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const register = {
  body: Joi.object().keys(registerBody),
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
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyProvider,
  magicLinkEmail,
  verifyMagicLink,
  updateAccountBody,
};
