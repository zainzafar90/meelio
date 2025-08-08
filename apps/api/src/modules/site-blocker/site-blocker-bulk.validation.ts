import Joi from "joi";

export const siteBlockerBulkValidation = {
  bulkSync: Joi.object().keys({
    creates: Joi.array().items(
      Joi.object().keys({
        clientId: Joi.string().optional(),
        url: Joi.string().required(),
        category: Joi.string().optional(),
        isBlocked: Joi.boolean().optional(),
      })
    ).optional().default([]),
    updates: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().optional(),
        clientId: Joi.string().optional(),
        url: Joi.string().optional(),
        category: Joi.string().optional(),
        isBlocked: Joi.boolean().optional(),
      }).or('id', 'clientId') // At least one of id or clientId must be present
    ).optional().default([]),
    deletes: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().optional(),
        clientId: Joi.string().optional(),
      }).or('id', 'clientId') // At least one of id or clientId must be present
    ).optional().default([]),
  }),
};