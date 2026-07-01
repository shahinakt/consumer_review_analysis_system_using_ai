import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
