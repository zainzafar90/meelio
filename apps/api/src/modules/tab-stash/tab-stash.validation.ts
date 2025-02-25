import Joi from "joi";

const createTabStash = {
  body: Joi.object().keys({
    windowId: Joi.string().required(),
    urls: Joi.array().items(Joi.string()).required(),
  }),
};

const updateTabStash = {
  body: Joi.object().keys({
    windowId: Joi.string().optional(),
    urls: Joi.array().items(Joi.string()).optional(),
  }),
};

export const tabStashValidation = {
  createTabStash,
  updateTabStash,
};
