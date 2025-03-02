import Joi from "joi";

export const soundscapesValidation = {
  createSoundscape: Joi.object().keys({
    name: Joi.string().required(),
    config: Joi.object().optional(),
    shareable: Joi.boolean().optional(),
  }),
  updateSoundscape: Joi.object().keys({
    name: Joi.string().optional(),
    config: Joi.object().optional(),
    shareable: Joi.boolean().optional(),
  }),
};
