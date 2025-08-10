import Joi from "joi";

export const tabStashValidation = {
  bulkSync: Joi.object().keys({
    creates: Joi.array()
      .items(
        Joi.object().keys({
          clientId: Joi.string().optional(),
          windowId: Joi.string().required(),
          urls: Joi.array().items(Joi.string().max(2000)).required(),
          tabsData: Joi.array()
            .items(
              Joi.object().keys({
                title: Joi.string().max(500).required(),
                url: Joi.string().max(2000).required(),
                favicon: Joi.string().max(2000).optional(),
                windowId: Joi.number().required(),
                pinned: Joi.boolean().required(),
              })
            )
            .allow(null)
            .optional(),
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
            windowId: Joi.string().optional(),
            urls: Joi.array().items(Joi.string().max(2000)).optional(),
            tabsData: Joi.array()
              .items(
                Joi.object().keys({
                  title: Joi.string().max(500).required(),
                  url: Joi.string().max(2000).required(),
                  favicon: Joi.string().max(2000).optional(),
                  windowId: Joi.number().required(),
                  pinned: Joi.boolean().required(),
                })
              )
              .allow(null)
              .optional(),
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