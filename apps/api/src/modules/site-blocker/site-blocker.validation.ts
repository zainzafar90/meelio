import Joi from "joi";

const createSiteBlocker = {
  body: Joi.object().keys({
    url: Joi.string().required(),
    category: Joi.string().optional(),
  }),
};

const updateSiteBlocker = {
  body: Joi.object().keys({
    url: Joi.string().optional(),
    category: Joi.string().optional(),
  }),
};

export const siteBlockerValidation = {
  createSiteBlocker,
  updateSiteBlocker,
};
