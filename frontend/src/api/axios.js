import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach/remove the Bearer token used for every subsequent request.
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// If any request comes back 401 (expired/invalid token), drop the stale
// session so the app redirects back to /login instead of looping on errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("pulseboard_token");
      setAuthToken(null);
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export const authEndpoints = {
  signup: (payload) => api.post("/auth/signup", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const endpoints = {
  health: () => api.get("/health"),
  predict: (payload) => api.post("/predict", payload),
  upload: (formData) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  dashboard: () => api.get("/dashboard"),
  recommendations: () => api.get("/recommendations"),
};

export default api;
