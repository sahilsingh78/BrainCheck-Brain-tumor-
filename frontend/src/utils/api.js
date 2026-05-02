import axios from "axios";

// 🔹 Base URL (auto switch dev / production)
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api"
    : "/api");

// 🔹 Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10s timeout
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bc_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 🔒 Unauthorized → logout
    if (status === 401) {
      localStorage.removeItem("bc_token");
      localStorage.removeItem("bc_user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // 🚫 Forbidden
    if (status === 403) {
      console.warn("Access denied");
    }

    // ⚠️ Server error
    if (status >= 500) {
      console.error("Server error:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;