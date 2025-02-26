import Joi from "joi";

export const pomodoroValidation = {
  createPomodoroSettings: {
    body: Joi.object().keys({
      workDuration: Joi.number().integer().min(1).max(120).required(),
      breakDuration: Joi.number().integer().min(1).max(60).required(),
      autoStart: Joi.boolean().optional(),
      autoBlock: Joi.boolean().optional(),
      soundOn: Joi.boolean().optional(),
      dailyFocusLimit: Joi.number().integer().min(0).max(1440).optional(),
    }),
  },
  updatePomodoroSettings: {
    body: Joi.object().keys({
      workDuration: Joi.number().integer().min(1).max(120).optional(),
      breakDuration: Joi.number().integer().min(1).max(60).optional(),
      autoStart: Joi.boolean().optional(),
      autoBlock: Joi.boolean().optional(),
      soundOn: Joi.boolean().optional(),
      dailyFocusLimit: Joi.number().integer().min(0).max(1440).optional(),
    }),
  },
};
