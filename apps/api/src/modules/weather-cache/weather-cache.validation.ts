import Joi from "joi";

const updateWeatherCache = {
  body: Joi.object().keys({
    weatherData: Joi.object().required(),
  }),
};

export const weatherCacheValidation = {
  updateWeatherCache,
};
