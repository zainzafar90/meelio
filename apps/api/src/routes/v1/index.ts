import express, { Router } from 'express';
import docsRoute from './swagger.route';
import userRoute from './user.route';
import accountRoute from './account.route';
import billingRoute from './billing.route';
import subscriptionRoute from './subscription.route';
import config from '../../config/config';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/account',
    route: accountRoute,
  },
  {
    path: '/billing',
    route: billingRoute,
  },
  {
    path: '/subscriptions',
    route: subscriptionRoute,
  },
];

const devIRoute: IRoute[] = [
  // IRoute available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
