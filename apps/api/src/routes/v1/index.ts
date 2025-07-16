import express, { Router } from "express";

import { config } from "@/config/config";

import authRoute from "./auth.routes";
import docsRoute from "./swagger.routes";
import userRoute from "./user.routes";
import billingRoute from "./billing.routes";
import subscriptionRoute from "./subscription.routes";
import mantraRoute from "./mantra.routes";
import taskRoute from "./task.routes";
import categoriesRoute from "./categories.routes";
import siteBlockerRoute from "./site-blocker.routes";
import tabStashRoute from "./tab-stash.routes";
import noteRoute from "./note.routes";
import focusSessionRoute from "./focus-session.routes";
import settingsRoute from "./settings.routes";
import calendarRoute from "./calendar.routes";

const router: express.Router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: "/account",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/billing",
    route: billingRoute,
  },
  {
    path: "/subscriptions",
    route: subscriptionRoute,
  },
  {
    path: "/mantras",
    route: mantraRoute,
  },
  {
    path: "/tasks",
    route: taskRoute,
  },
  {
    path: "/categories",
    route: categoriesRoute,
  },
  {
    path: "/site-blockers",
    route: siteBlockerRoute,
  },
  {
    path: "/tab-stashes",
    route: tabStashRoute,
  },
  {
    path: "/notes",
    route: noteRoute,
  },
  {
    path: "/focus-sessions",
    route: focusSessionRoute,
  },
  {
    path: "/calendar",
    route: calendarRoute,
  },
  {
    path: "/settings",
    route: settingsRoute,
  },
];

const devIRoute: IRoute[] = [
  // IRoute available only in development mode
  {
    path: "/docs",
    route: docsRoute,
  },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === "development") {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
