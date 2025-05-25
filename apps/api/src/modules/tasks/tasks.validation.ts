import Joi from "joi";

export const tasksValidation = {
  createTask: Joi.object().keys({
    title: Joi.string().required(),
    completed: Joi.boolean().optional(),
    category: Joi.string().optional(),
    dueDate: Joi.date().optional(),
  }),
  updateTask: Joi.object().keys({
    title: Joi.string().optional(),
    completed: Joi.boolean().optional(),
    category: Joi.string().optional(),
    dueDate: Joi.date().optional().allow(null),
  }),
};