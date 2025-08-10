import Joi from "joi";

export const siteBlockerValidation = {
  bulkSync: Joi.object().keys({
    creates: Joi.array()
      .items(
        Joi.object().keys({
          clientId: Joi.string().optional(),
          url: Joi.string().max(500).required(),
          category: Joi.string().max(100).allow(null).optional(),
          isBlocked: Joi.boolean().optional(),
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
            url: Joi.string().max(500).optional(),
            category: Joi.string().max(100).allow(null).optional(),
            isBlocked: Joi.boolean().optional(),
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