import Joi from "joi";
import { TaskStatus } from "@/db/schema";

export const tasksValidation = {
  createTask: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    category: Joi.string().optional(),
    isFocus: Joi.boolean().optional(),
    status: Joi.string()
      .valid(...Object.values(TaskStatus))
      .optional(),
    dueDate: Joi.date().optional(),
  }),
  updateTask: Joi.object().keys({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    category: Joi.string().optional(),
    isFocus: Joi.boolean().optional(),
    status: Joi.string()
      .valid(...Object.values(TaskStatus))
      .optional(),
    dueDate: Joi.date().optional(),
  }),
};
