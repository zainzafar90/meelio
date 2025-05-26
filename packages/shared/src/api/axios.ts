import Axios from "axios";

import { env } from "../utils/env.utils";
import { useAuthStore } from "../stores/auth.store";

/*
|--------------------------------------------------------------------------
| Axios
|--------------------------------------------------------------------------
|
| This file configures Axios, the HTTP client used to make requests to the
| server. It also configures the interceptors to handle errors and
| notifications.
|
*/

const axios = Axios.create({
  baseURL: env.serverUrl,
});

axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export { axios };
