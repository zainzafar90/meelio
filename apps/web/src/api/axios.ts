import { useNotificationStore } from "@/stores/notification.store";
import Axios from "axios";

import { env } from "@/utils/common.utils";

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
  baseURL: env.VITE_SERVER_URL,
});

axios.defaults.withCredentials = true;
axios.defaults.baseURL = env.VITE_SERVER_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

axios.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message;
    useNotificationStore.getState().addNotification({
      type: "error",
      title: "Error",
      message,
    });

    return Promise.reject(error);
  }
);

export { axios };
