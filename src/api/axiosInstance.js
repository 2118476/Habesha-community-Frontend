import axios from 'axios';

// Create a reusable Axios instance for the application. This sets
// the base URL for all requests to the backend and attaches the
// JWT token from localStorage on each request. If you deploy your
// backend to a different URL or port, update the baseURL accordingly.
const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Request interceptor to attach the Authorization header when a
// token exists in localStorage. This ensures authenticated calls
// automatically send the bearer token to the backend.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;