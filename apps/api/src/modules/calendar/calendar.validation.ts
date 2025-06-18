import Joi from "joi";

const saveToken = {
  body: Joi.object().keys({
    accessToken: Joi.string().required(),
    refreshToken: Joi.string().required(),
    expiresAt: Joi.date().required(),
  }),
};

export const calendarValidation = { saveToken };