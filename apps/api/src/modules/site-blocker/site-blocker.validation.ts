import Joi from "joi";

export const siteBlockerValidation = {
  createSiteBlocker: Joi.object().keys({
    url: Joi.string().required(),
    category: Joi.string().optional(),
  }),
  updateSiteBlocker: Joi.object().keys({
    url: Joi.string().optional(),
    category: Joi.string().optional(),
  }),
};
