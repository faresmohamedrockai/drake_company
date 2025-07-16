import axios from 'axios';

const axiosInterceptor = axios.create({
    baseURL: 'https://ca582cea704f.ngrok-free.app/api',
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