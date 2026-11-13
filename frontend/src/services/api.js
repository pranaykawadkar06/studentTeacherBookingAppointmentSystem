import axios from 'axios';

// The only place the API URL is read. Configure it via VITE_API_BASE_URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // send the httpOnly auth cookie
  timeout: 20000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    // Session expired mid-use: let the auth context sign the user out.
    if (err.response?.status === 401 && !url.startsWith('/auth/')) window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(err);
  }
);

export default api;
