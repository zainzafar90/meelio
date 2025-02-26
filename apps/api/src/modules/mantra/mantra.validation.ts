import Joi from "joi";
import { MantraType } from "@/db/schema";

export const mantraValidation = {
  createMantra: Joi.object().keys({
    text: Joi.string().required(),
    type: Joi.string()
      .valid(...Object.values(MantraType))
      .required(),
    date: Joi.date().optional(),
  }),
  updateMantra: Joi.object().keys({
    text: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(MantraType))
      .optional(),
    date: Joi.date().optional(),
  }),
};
