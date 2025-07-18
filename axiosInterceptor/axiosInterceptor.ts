import axios from 'axios';

const axiosInterceptor = axios.create({
    baseURL: 'https://crm-backend-production-d062.up.railway.app/api',
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