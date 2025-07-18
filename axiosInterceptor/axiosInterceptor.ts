import axios from "axios";

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies are sent with requests
});

axiosInstance.interceptors.request.use(
  (config) => {
    // No need to manually attach tokens; server will read from cookies
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    // No need to manually store tokens; server should set cookies via Set-Cookie
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest.url !== "/auth/login" &&
      originalRequest.url !== "/refresh"
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const response = await axiosInstance.post("/refresh");
          if (response.status === 200) {
            processQueue(null, null); // token value is not needed, just signal
            isRefreshing = false;
            return axiosInstance.request(originalRequest);
          }
        } catch (refreshError: any) {
          console.error("Refresh token error:", refreshError);
          processQueue(refreshError, null);
          isRefreshing = false;
          if (refreshError?.response?.status === 401) {
            window.location.href = "/login";
            return; // Stop further processing
          }
          return Promise.reject({
            message: "Session expired",
            shouldRedirect: true,
          });
        }
      }

      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            resolve(axiosInstance.request(originalRequest));
          },
          reject: (err: any) => reject(err),
        });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
