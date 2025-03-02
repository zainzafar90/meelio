import Joi from "joi";

export const tabStashValidation = {
  createTabStash: Joi.object().keys({
    windowId: Joi.string().required(),
    urls: Joi.array().items(Joi.string()).required(),
  }),
  updateTabStash: Joi.object().keys({
    windowId: Joi.string().optional(),
    urls: Joi.array().items(Joi.string()).optional(),
  }),
};
