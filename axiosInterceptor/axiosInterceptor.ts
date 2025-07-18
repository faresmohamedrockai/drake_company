import axios from 'axios';

const axiosInterceptor = axios.create({
    baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
});

axiosInterceptor.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log("token", token);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.Accept = 'application/json';
        // config.withCredentials = true;
    }
    return config;
});

export default axiosInterceptor;