import Joi from "joi";

export const providerValidation = {
  createProvider: Joi.object().keys({
    name: Joi.string().required(),
    displayName: Joi.string().required(),
    enabled: Joi.boolean().optional(),
    clientId: Joi.string().optional(),
    clientSecret: Joi.string().optional(),
    scopes: Joi.array().items(Joi.string()).optional(),
    authUrl: Joi.string().uri().optional(),
    tokenUrl: Joi.string().uri().optional(),
    userInfoUrl: Joi.string().uri().optional(),
  }),
  updateProvider: Joi.object().keys({
    displayName: Joi.string().optional(),
    enabled: Joi.boolean().optional(),
    clientId: Joi.string().optional(),
    clientSecret: Joi.string().optional(),
    scopes: Joi.array().items(Joi.string()).optional(),
    authUrl: Joi.string().uri().optional(),
    tokenUrl: Joi.string().uri().optional(),
    userInfoUrl: Joi.string().uri().optional(),
  }),
};