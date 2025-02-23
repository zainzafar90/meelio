import { logger } from './logger';
import { errorHandler, successHandler } from './morgan';

const morgan = {
  successHandler,
  errorHandler,
};
export { logger, morgan };
