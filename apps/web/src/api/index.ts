import * as authApi from "./auth.api";
import * as billingApi from "./billing.api";

const api = {
  auth: authApi,
  billing: billingApi,
};

export { api };
