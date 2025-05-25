import axios, { AxiosInstance } from "axios";

const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:8080/api/v1";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token if available
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, config = {}) {
    return this.client.get(url, config);
  }

  post(url: string, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  put(url: string, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  patch(url: string, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  delete(url: string, config = {}) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();