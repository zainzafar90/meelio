import Axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { env } from "../utils/env.utils";
import { useAuthStore } from "../stores/auth.store";
import { clearLocalData } from "../utils/clear-data.utils";

type RequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type QueuedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

const axios = Axios.create({
  baseURL: env.serverUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const createTokenRefreshManager = () => {
  const state = {
    isRefreshing: false,
    queuedRequests: [] as QueuedRequest[],
  };

  const logoutUser = async () => {
    const { user, logoutUser } = useAuthStore.getState();
    logoutUser();
    if (user) {
      await clearLocalData();
    }
  };

  const isAuthenticationError = (error: unknown): boolean => {
    return (
      error instanceof Error &&
      (error as AxiosError).response?.status === 401
    );
  };

  const resolveQueuedRequests = () => {
    state.queuedRequests.forEach(({ resolve }) => resolve(null));
    state.queuedRequests = [];
  };

  const rejectQueuedRequests = (error: unknown) => {
    state.queuedRequests.forEach(({ reject }) => reject(error));
    state.queuedRequests = [];
  };

  const queueRequest = (originalRequest: RequestConfig): Promise<any> => {
    return new Promise((resolve, reject) => {
      state.queuedRequests.push({
        resolve: () => axios(originalRequest).then(resolve).catch(reject),
        reject,
      });
    });
  };

  const performTokenRefresh = async (
    originalRequest: RequestConfig
  ): Promise<any> => {
    state.isRefreshing = true;

    try {
      await axios.post("/v1/account/refresh-tokens");
      resolveQueuedRequests();
      return axios(originalRequest);
    } catch (error) {
      rejectQueuedRequests(error);

      if (isAuthenticationError(error)) {
        await logoutUser();
      }

      throw error;
    } finally {
      state.isRefreshing = false;
    }
  };

  const handleTokenRefresh = async (
    originalRequest: RequestConfig
  ): Promise<any> => {
    if (state.isRefreshing) {
      return queueRequest(originalRequest);
    }

    return performTokenRefresh(originalRequest);
  };

  return { handleTokenRefresh, logoutUser };
};

const tokenRefreshManager = createTokenRefreshManager();

const isUnauthorizedError = (error: AxiosError): boolean => {
  return error.response?.status === 401;
};

const isRefreshTokenEndpoint = (config?: RequestConfig): boolean => {
  return config?.url?.includes("/refresh-tokens") ?? false;
};

const isGuestUser = (): boolean => {
  const { user, guestUser } = useAuthStore.getState();
  return !user && !!guestUser;
};

const shouldAttemptTokenRefresh = (
  error: AxiosError,
  config?: RequestConfig
): boolean => {
  if (!config || config._retry) return false;
  if (!isUnauthorizedError(error)) return false;
  if (isRefreshTokenEndpoint(config)) return false;
  if (isGuestUser()) return false;
  return true;
};

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RequestConfig | undefined;

    if (!shouldAttemptTokenRefresh(error, config)) {
      if (isRefreshTokenEndpoint(config) && isUnauthorizedError(error)) {
        await tokenRefreshManager.logoutUser();
      }
      return Promise.reject(error);
    }

    config!._retry = true;
    return tokenRefreshManager.handleTokenRefresh(config!);
  }

);

export { axios };
