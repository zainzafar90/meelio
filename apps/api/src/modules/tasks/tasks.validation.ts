import Joi from "joi";

export const tasksValidation = {
  createTask: Joi.object().keys({
    title: Joi.string().required(),
    completed: Joi.boolean().optional(),
    pinned: Joi.boolean().optional(),
    dueDate: Joi.date().optional(),
    categoryId: Joi.string().uuid().optional(),
    providerId: Joi.string().uuid().optional(),
  }),
  updateTask: Joi.object().keys({
    title: Joi.string().optional(),
    completed: Joi.boolean().optional(),
    pinned: Joi.boolean().optional(),
    dueDate: Joi.date().optional().allow(null),
    updatedAt: Joi.number().optional(),
    categoryId: Joi.string().uuid().optional().allow(null),
    providerId: Joi.string().uuid().optional().allow(null),
  }),
};