import Joi from "joi";

export const tasksValidation = {
  createTask: Joi.object().keys({
    title: Joi.string().required(),
    completed: Joi.boolean().optional(),
    pinned: Joi.boolean().optional(),
    dueDate: Joi.date().optional(),
  }),
  updateTask: Joi.object().keys({
    title: Joi.string().optional(),
    completed: Joi.boolean().optional(),
    pinned: Joi.boolean().optional(),
    dueDate: Joi.date().optional().allow(null),
    updatedAt: Joi.number().optional(),
  }),
};