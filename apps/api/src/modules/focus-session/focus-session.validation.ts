import Joi from "joi";

export const focusSessionValidation = {
  createFocusSession: Joi.object().keys({
    sessionStart: Joi.date().required(),
    sessionEnd: Joi.date().required(),
    duration: Joi.number().integer().min(1).required(),
  }),
  updateFocusSession: Joi.object().keys({
    sessionStart: Joi.date().optional(),
    sessionEnd: Joi.date().optional(),
    duration: Joi.number().integer().min(1).optional(),
  }),
};
