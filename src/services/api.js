import axios from 'axios';

const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const api = axios.create({
    baseURL: `${API_URL}/api`,
});

// Automatically attach the logged-in user's token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sms_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle subscription expiration globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 402 &&
            error.response?.data?.code === 'SUBSCRIPTION_REQUIRED'
        ) {
            if (window.location.pathname !== '/billing') {
                window.location.href = '/billing';
            }
        }

        return Promise.reject(error);
    }
);

export default api;