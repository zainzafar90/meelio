import Joi from "joi";

const createBackground = {
  body: Joi.object().keys({
    type: Joi.string().valid("static", "live").required(),
    url: Joi.string().required(),
    metadata: Joi.object()
      .keys({
        name: Joi.string().required(),
        category: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).required(),
        thumbnailUrl: Joi.string().required(),
      })
      .required(),
    isFavorite: Joi.boolean().optional(),
  }),
};

const updateBackground = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    type: Joi.string().valid("static", "live").optional(),
    url: Joi.string().optional(),
    metadata: Joi.object()
      .keys({
        name: Joi.string().optional(),
        category: Joi.string().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        thumbnailUrl: Joi.string().optional(),
      })
      .optional(),
    isFavorite: Joi.boolean().optional(),
  }),
};

const getBackground = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteBackground = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const backgroundValidation = {
  createBackground,
  updateBackground,
  getBackground,
  deleteBackground,
};
