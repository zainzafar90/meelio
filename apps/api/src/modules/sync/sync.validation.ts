import Joi from "joi";

const bulkSync = {
  body: Joi.object().keys({
    operations: Joi.array()
      .items(
        Joi.object().keys({
          entity: Joi.string().required(),
          operation: Joi.string()
            .valid("create", "update", "delete")
            .required(),
          data: Joi.object().required(),
          clientId: Joi.string().required(),
          timestamp: Joi.date().required(),
        })
      )
      .required(),
    lastSyncTimestamp: Joi.date().optional(),
  }),
};

const getSyncStatus = {
  query: Joi.object().keys({
    entities: Joi.array().items(Joi.string()).optional(),
  }),
};

const getBulkFeed = {
  query: Joi.object().keys({
    syncTypes: Joi.string().optional(),
    localDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        "string.pattern.base": "localDate must be in YYYY-MM-DD format",
      }),
  }),
};

export const syncValidation = {
  bulkSync,
  getSyncStatus,
  getBulkFeed,
};
