import Joi from "joi";

const createPomodoroSettings = {
  body: Joi.object().keys({
    workDuration: Joi.number().integer().min(1).max(120).required(),
    breakDuration: Joi.number().integer().min(1).max(60).required(),
    autoStart: Joi.boolean().optional(),
    autoBlock: Joi.boolean().optional(),
    soundOn: Joi.boolean().optional(),
    dailyFocusLimit: Joi.number().integer().min(0).max(1440).optional(),
  }),
};

const updatePomodoroSettings = {
  body: Joi.object().keys({
    workDuration: Joi.number().integer().min(1).max(120).optional(),
    breakDuration: Joi.number().integer().min(1).max(60).optional(),
    autoStart: Joi.boolean().optional(),
    autoBlock: Joi.boolean().optional(),
    soundOn: Joi.boolean().optional(),
    dailyFocusLimit: Joi.number().integer().min(0).max(1440).optional(),
  }),
};

export const pomodoroValidation = {
  createPomodoroSettings,
  updatePomodoroSettings,
};
