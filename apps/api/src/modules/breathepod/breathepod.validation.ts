import Joi from "joi";

const updateBreathepod = {
  body: Joi.object().keys({
    config: Joi.object().required(),
  }),
};

export const breathepodValidation = {
  updateBreathepod,
};
