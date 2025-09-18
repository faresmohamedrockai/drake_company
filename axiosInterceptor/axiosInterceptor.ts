// --- START OF FILE: axiosInterceptor.ts ---

import axios, { AxiosInstance } from "axios";
import Cookies from 'js-cookie'; // 1. استيراد js-cookie
import i18n from "@/i18n"; // لو مستخدم i18next

let navigateFunction: (path: string) => void;


export const setNavigate = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

const axiosInterceptor: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// معترض الطلبات (Request interceptor)
axiosInterceptor.interceptors.request.use(
  (config) => {
    // 3. قراءة التوكن من الـ cookie بدلًا من localStorage
    const token = Cookies.get("token");
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

// معترض الاستجابات (Response interceptor)
axiosInterceptor.interceptors.response.use(
  (response) => response,
  (error) => {
    // التحقق من أن الخطأ هو خطأ 401 (غير مصرح به)
    if (error.response && error.response.status === 401) {
      // حذف بيانات المصادقة
      Cookies.remove("token");
      localStorage.removeItem("propai_user");

      
      if (navigateFunction) {
       
        navigateFunction("/login");
      } else {
      
        console.error("Navigate function not set for axios interceptor.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInterceptor;