import Joi from "joi";

export const categoriesValidation = {
  createCategory: Joi.object().keys({
    name: Joi.string().required().trim().min(1).max(50),
  }),
  updateCategory: Joi.object().keys({
    name: Joi.string().required().trim().min(1).max(50),
  }),
};