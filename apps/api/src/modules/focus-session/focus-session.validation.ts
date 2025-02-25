import Joi from "joi";

const createFocusSession = {
  body: Joi.object().keys({
    sessionStart: Joi.date().required(),
    sessionEnd: Joi.date().required(),
    duration: Joi.number().integer().min(1).required(),
  }),
};

const updateFocusSession = {
  body: Joi.object().keys({
    sessionStart: Joi.date().optional(),
    sessionEnd: Joi.date().optional(),
    duration: Joi.number().integer().min(1).optional(),
  }),
};

export const focusSessionValidation = {
  createFocusSession,
  updateFocusSession,
};
