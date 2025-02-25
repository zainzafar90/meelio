import Joi from "joi";

const createNote = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().optional(),
  }),
};

const updateNote = {
  body: Joi.object().keys({
    title: Joi.string().optional(),
    content: Joi.string().optional(),
  }),
};

export const noteValidation = {
  createNote,
  updateNote,
};
