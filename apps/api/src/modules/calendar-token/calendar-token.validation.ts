import Joi from "joi";

const saveToken = {
  body: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export const calendarTokenValidation = { saveToken };
