import Joi from "joi";

export const categoryValidation = {
  createCategory: Joi.object().keys({
    name: Joi.string().valid(
      "Productivity",
      "Relax",
      "NoiseBlocker",
      "CreativeThinking",
      "BeautifulAmbients",
      "Random",
      "Motivation",
      "Sleep",
      "Studying",
      "Writing"
    ).required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
  }),
  updateCategory: Joi.object().keys({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
  }),
};