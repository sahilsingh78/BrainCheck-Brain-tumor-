import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import MyScansPage from "./pages/MyScansPage";
import ScanDetailPage from "./pages/ScanDetailPage";
import AdminPage from "./pages/AdminPage";
import DoctorScansPage from "./pages/DoctorScansPage";
import AppLayout from "./components/layout/AppLayout";

import "./index.css";


// 🔹 Common Loader
const FullScreenLoader = () => (
  <div className="loading-screen">
    <div className="spinner" />
    <span>Loading...</span>
  </div>
);


// 🔐 Private Route
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return user ? children : <Navigate to="/login" replace />;
};


// 🌍 Public Route (login/register)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return user ? <Navigate to="/dashboard" replace /> : children;
};


// 🛡️ Admin Only
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};


// 🧑‍⚕️ Doctor + Admin
const DoctorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!["doctor", "admin"].includes(user.role))
    return <Navigate to="/dashboard" replace />;

  return children;
};


// 🚀 MAIN APP
const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* 🔓 Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />


          {/* 🔐 Private Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="my-scans" element={<MyScansPage />} />
            <Route path="scans/:id" element={<ScanDetailPage />} />

            {/* 🧑‍⚕️ Doctor */}
            <Route
              path="doctor/scans"
              element={
                <DoctorRoute>
                  <DoctorScansPage />
                </DoctorRoute>
              }
            />

            {/* 🛡️ Admin */}
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>


          {/* ❌ Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;