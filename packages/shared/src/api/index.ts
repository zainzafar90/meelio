import * as authApi from "./auth.api";
import * as billingApi from "./billing.api";
import * as weatherApi from "./weather.api";

const api = {
  auth: authApi,
  billing: billingApi,
  weather: weatherApi,
};

export { api };
