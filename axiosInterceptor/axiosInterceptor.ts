import axios from "axios";
import i18n from "@/i18n"; // لو مستخدم i18next


const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // اللغة
    const lang = i18n.language || "en";
    config.headers["Accept-Language"] = lang;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // امسح الـ token
      localStorage.removeItem("token");

      // رجّع المستخدم على صفحة تسجيل الدخول
      window.location.href = "/login"; 
      // أو لو عندك React Router ممكن تستخدم navigate("/login")
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
