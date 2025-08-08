import Joi from "joi";

export const tabStashBulkValidation = {
  bulkSync: Joi.object().keys({
    creates: Joi.array().items(
      Joi.object().keys({
        clientId: Joi.string().optional(),
        windowId: Joi.string().required(),
        urls: Joi.array().items(Joi.string()).required(),
      })
    ).optional().default([]),
    updates: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().optional(),
        clientId: Joi.string().optional(),
        windowId: Joi.string().optional(),
        urls: Joi.array().items(Joi.string()).optional(),
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