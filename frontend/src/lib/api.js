import axios from "axios";

const TOKEN_KEY = "lavanet_api_token";

export const hasApiBackend = () => Boolean(process.env.REACT_APP_BACKEND_URL);

export const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "",
  timeout: 15000,
  withCredentials: true,
});

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
};

const existing = localStorage.getItem(TOKEN_KEY);
if (existing) setAuthToken(existing);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) setAuthToken(null);
    return Promise.reject(err);
  }
);

export default api;
