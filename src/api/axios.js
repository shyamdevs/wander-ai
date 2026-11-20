import axios from "axios";

// Sessions live in an HttpOnly cookie that JavaScript cannot read. Drop any token that an older
// version of the app left in localStorage so it does not linger.
try { localStorage.removeItem("wander_token"); } catch { /* storage unavailable */ }

// The CSRF token is kept in memory only (never persisted) and re-issued by /auth/me on every page load.
let csrfToken = null;
let unauthorizedHandler = null;
export const setCsrfToken = (token) => { csrfToken = token || null; };
export const getCsrfToken = () => csrfToken;
export const onUnauthorized = (handler) => { unauthorizedHandler = handler; };
const configuredApiBase = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
export const apiBase = () => configuredApiBase || "/api";

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true, // send the session cookie
  timeout: 75000, // AI planning can take a while, but never hang forever
});

const SAFE_METHODS = new Set(["get", "head", "options"]);
const AUTH_ENDPOINTS = /\/auth\/(login|signup|me)$/;

api.interceptors.request.use((config) => {
  if (csrfToken && !SAFE_METHODS.has(String(config.method).toLowerCase()) && !config.headers["X-CSRF-Token"]) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked session anywhere in the app sends the user back to sign-in.
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.test(error.config?.url || "")) unauthorizedHandler?.();
    return Promise.reject(error);
  }
);

export default api;
