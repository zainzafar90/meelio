import Joi from "joi";

export const noteValidation = {
  bulkSync: Joi.object().keys({
    creates: Joi.array()
      .items(
        Joi.object().keys({
          clientId: Joi.string().optional(),
          title: Joi.string().max(200).required(),
          content: Joi.string().max(10000).allow(null).optional(),
          categoryId: Joi.string().allow(null).optional(),
          providerId: Joi.string().allow(null).optional(),
          updatedAt: Joi.date().optional(),
        })
      )
      .optional()
      .default([]),
    updates: Joi.array()
      .items(
        Joi.object()
          .keys({
            id: Joi.string().optional(),
            clientId: Joi.string().optional(),
            title: Joi.string().max(200).optional(),
            content: Joi.string().max(10000).allow(null).optional(),
            categoryId: Joi.string().allow(null).optional(),
            providerId: Joi.string().allow(null).optional(),
            updatedAt: Joi.date().optional(),
            deletedAt: Joi.alternatives().try(Joi.date(), Joi.allow(null)).optional(),
          })
          .or("id", "clientId")
      )
      .optional()
      .default([]),
    deletes: Joi.array()
      .items(
        Joi.object()
          .keys({
            id: Joi.string().optional(),
            clientId: Joi.string().optional(),
            deletedAt: Joi.date().optional(),
          })
          .or("id", "clientId")
      )
      .optional()
      .default([]),
  }),
};
