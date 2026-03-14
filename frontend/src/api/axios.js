import axios from 'axios';

// Create a single Axios instance for the entire app.
// All API calls import this instead of using axios directly.
// This gives us one place to configure base URL, headers, and interceptors.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
});

// REQUEST interceptor — runs before every request is sent.
// Automatically attaches the JWT to the Authorization header.
// This means every component that calls api.get/post/etc gets auth for free
// without needing to think about headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ftta_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE interceptor — runs after every response (or error) comes back.
// Handles 401 Unauthorized globally: if ANY request returns 401,
// the token is expired or invalid, so we clear it and send the user to login.
// Without this, expired tokens would cause silent failures everywhere.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ftta_token');
      // Hard redirect — clears React state too, which is exactly what we want
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
