import Joi from 'joi';
import { objectId } from '../validate';

const getSubscription = {
  params: Joi.object().keys({
    subscriptionId: Joi.string().custom(objectId),
  }),
};

export const subscriptionValidation = {
  getSubscription,
};
