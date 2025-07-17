import Joi from "joi";

export const categoriesValidation = {
  createCategory: Joi.object().keys({
    name: Joi.string().required().trim().min(1).max(50),
    icon: Joi.string().optional().trim().max(10),
  }),
  updateCategory: Joi.object().keys({
    name: Joi.string().required().trim().min(1).max(50),
    icon: Joi.string().optional().trim().max(10),
  }),
};