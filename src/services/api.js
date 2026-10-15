import axios from 'axios';

const api = axios.create({
    baseURL:  'http://localhost:5000/api' ,   

    //xisco-sms-backend.onrender.com/api',//'http://localhost:5000/api',
});



// Add an Interceptor: This runs BEFORE every request leaves your browser
// Automatically attach the logged-in user's token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sms_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle subscription expiration globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response?.status === 402 &&
      error.response?.data?.code === 'SUBSCRIPTION_REQUIRED'
    ) {
      // Don't redirect if already on Billing
      if (window.location.pathname !== '/billing') {
        window.location.href = '/billing';
      }
    }

    return Promise.reject(error);
  }
);

export default api;