import Joi from "joi";

export const noteValidation = {
  createNote: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().optional(),
  }),
  updateNote: Joi.object().keys({
    title: Joi.string().optional(),
    content: Joi.string().optional(),
  }),
};
