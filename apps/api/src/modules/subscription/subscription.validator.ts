import Joi from "joi";

const getSubscription = {
  params: Joi.object().keys({
    subscriptionId: Joi.string(),
  }),
};

export const subscriptionValidation = {
  getSubscription,
};
