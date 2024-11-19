import Joi from "joi";

export const weatherValidation = {
  getWeather: {
    query: Joi.object().keys({
      locationId: Joi.string().required(),
    }),
  },
};
