import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load user from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bc_user");
      const token = localStorage.getItem("bc_token");

      if (saved && token) {
        setUser(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to parse user from storage");
      localStorage.removeItem("bc_user");
      localStorage.removeItem("bc_token");
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Login
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });

      localStorage.setItem("bc_token", data.token);
      localStorage.setItem("bc_user", JSON.stringify(data.user));

      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err.response?.data?.message || "Login failed";
    }
  };

  // 🔹 Register
  const register = async (name, email, password, role) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      localStorage.setItem("bc_token", data.token);
      localStorage.setItem("bc_user", JSON.stringify(data.user));

      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err.response?.data?.message || "Registration failed";
    }
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("bc_token");
    localStorage.removeItem("bc_user");
    setUser(null);
  };

  // 🔹 Optional: Refresh user from backend
  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      localStorage.setItem("bc_user", JSON.stringify(data));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,

        // 🔹 Role helpers
        isAdmin: user?.role === "admin",
        isDoctor: user?.role === "doctor" || user?.role === "admin",
        isPatient: user?.role === "patient",
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);