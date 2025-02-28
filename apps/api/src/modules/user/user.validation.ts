import Joi from "joi";

import { RoleType } from "@/types/enums.types";

import { password, uuid } from "@/common/validate/custom.validation";
import { CreateUserReq } from "@/types/api/api-payloads";

const createUserBody: Record<keyof CreateUserReq, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  image: Joi.string().optional(),
  role: Joi.string().valid(RoleType.User, RoleType.Guest).required(),
};

export const userValidation = {
  createUser: {
    body: Joi.object().keys(createUserBody),
  },

  getUsers: {
    query: Joi.object().keys({
      name: Joi.string(),
      role: Joi.string(),
      sortBy: Joi.string(),
      sortOrder: Joi.string().valid("asc", "desc"),
      projectBy: Joi.string(),
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
    }),
  },

  getUser: {
    params: Joi.object().keys({
      userId: Joi.string().custom(uuid),
    }),
  },

  updateUser: {
    params: Joi.object().keys({
      userId: Joi.required().custom(uuid),
    }),
    body: Joi.object()
      .keys({
        email: Joi.string().email(),
        password: Joi.string().custom(password),
        name: Joi.string(),
      })
      .min(1),
  },

  deleteUser: {
    params: Joi.object().keys({
      userId: Joi.string().custom(uuid),
    }),
  },

  // createGuestUser: {
  //   body: Joi.object().keys({
  //     name: Joi.string().required(),
  //   }),
  // },

  convertGuestToRegular: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required().min(8),
    }),
    params: Joi.object().keys({
      userId: Joi.string().required(),
    }),
  },
};
