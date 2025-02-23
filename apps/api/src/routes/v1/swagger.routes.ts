import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { swaggerDefinition } from '@/common/swagger/swagger.definition';

const router = express.Router();

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['apps/api/packages/components.yaml', 'apps/api/src/routes/v1/**/*.ts'],
});

router.use('/', swaggerUi.serve as any);
router.get('/', (req, res) => {
  return swaggerUi.setup(specs, {
    explorer: true,
  });
});

export default router;
