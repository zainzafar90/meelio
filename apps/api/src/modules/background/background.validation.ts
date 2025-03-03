import Joi from "joi";

export const backgroundValidation = {
  setSelectedBackground: {
    body: Joi.object().keys({
      backgroundId: Joi.string().required(),
    }),
  },
};
