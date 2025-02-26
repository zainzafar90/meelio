import * as authApi from "./auth.api";
import * as billingApi from "./billing.api";
import * as weatherApi from "./weather.api";
import * as focusSessionsApi from "./focus-sessions.api";

const api = {
  auth: authApi,
  billing: billingApi,
  weather: weatherApi,
  focusSessions: focusSessionsApi,
};

export { api };
