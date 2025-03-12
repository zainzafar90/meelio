import Joi from "joi";

export const backgroundValidation = {
  setFavouriteBackground: {
    body: Joi.object().keys({
      backgroundId: Joi.string().required(),
    }),
  },
};
