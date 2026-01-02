// src/api/axiosInstance.js (or wherever this lives)
import axios from "axios";

// fallback to localhost if no env var is set
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Attach JWT token automatically for any request if it exists. The
// AuthContext will also set a default Authorization header on login,
// but this interceptor provides a fallback for other requests or
// components that initialise before AuthContext runs. We use the
// namespaced key defined in AuthContext (auth.token) to read the
// token from localStorage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth.token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize errors globally so UI can present consistent messages. This
// interceptor attaches a normalized `error.normalized` object that
// contains status, message, data and a network flag.  Components
// consuming API calls can use this to present consistent error
// messages and differentiate between network errors and server
// responses.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = error || {};
    const status = err.response?.status;
    const data = err.response?.data;
    
    let message =
      (typeof data === 'string' && data) ||
      data?.message ||
      data?.error ||
      err.message ||
      'Something went wrong. Please try again.';
    
    // Provide friendly message for network errors (likely backend sleeping on Render)
    if (!err.response && err.code === 'NETWORK_ERROR') {
      message = 'Backend is waking up (Render free tier). Please try again in a moment.';
    }
    
    // Attach a normalized shape for downstream consumers.
    err.normalized = {
      status: status ?? 0,
      message,
      data,
      network: !err.response,
    };
    return Promise.reject(err);
  }
);

export default api;
