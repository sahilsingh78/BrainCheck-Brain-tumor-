import axios from "axios";

// 🔹 Base URL (STRICT: must come from env in production)
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api"; // fallback only for local

if (!process.env.REACT_APP_API_URL) {
  console.warn("⚠️ REACT_APP_API_URL not set. Using localhost.");
}

// 🔹 Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach token
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

// ⚠️ Handle errors globally
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
      console.warn("🚫 Access denied");
    }

    // 🔥 Server error
    if (status >= 500) {
      console.error("🔥 Server error:", error.response?.data);
    }

    // 🌐 Network error
    if (!error.response) {
      console.error("🌐 Network error / Backend not reachable");
    }

    return Promise.reject(error);
  }
);

export default api;