import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
  // baseURL: `http://localhost:3000/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
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
);

export default axiosInstance;
