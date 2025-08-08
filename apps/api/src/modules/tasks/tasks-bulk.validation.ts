import Joi from "joi";

export const tasksBulkValidation = {
  bulkSync: Joi.object().keys({
    creates: Joi.array().items(
      Joi.object().keys({
        clientId: Joi.string().optional(),
        title: Joi.string().required(),
        completed: Joi.boolean().optional(),
        pinned: Joi.boolean().optional(),
        dueDate: Joi.alternatives().try(
          Joi.string().isoDate(),
          Joi.number(),
          Joi.allow(null)
        ).optional(),
        categoryId: Joi.string().allow(null).optional(),
        providerId: Joi.string().allow(null).optional(),
        updatedAt: Joi.date().optional(),
      })
    ).optional().default([]),
    updates: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().optional(),
        clientId: Joi.string().optional(),
        title: Joi.string().optional(),
        completed: Joi.boolean().optional(),
        pinned: Joi.boolean().optional(),
        dueDate: Joi.alternatives().try(
          Joi.string().isoDate(),
          Joi.number(),
          Joi.allow(null)
        ).optional(),
        categoryId: Joi.string().allow(null).optional(),
        providerId: Joi.string().allow(null).optional(),
        updatedAt: Joi.date().optional(),
        deletedAt: Joi.alternatives().try(
          Joi.date(),
          Joi.allow(null)
        ).optional(),
      }).or('id', 'clientId') // At least one of id or clientId must be present
    ).optional().default([]),
    deletes: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().optional(),
        clientId: Joi.string().optional(),
        deletedAt: Joi.date().optional(),
      }).or('id', 'clientId') // At least one of id or clientId must be present
    ).optional().default([]),
  }),
};