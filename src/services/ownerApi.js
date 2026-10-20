import axios from 'axios';

const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000'
).trim().replace(/\/+$/, '');

const ownerApi = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 20000,
});

ownerApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('owner_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default ownerApi;