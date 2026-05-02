import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AppLayout = () => {
  const { user, logout, isAdmin, isDoctor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // 🔹 Close sidebar on route change (mobile fix)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // 🔹 Logout with confirmation
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  // 🔹 Safe initials
  const initials = (name = "") =>
    name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";

  const close = () => setOpen(false);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🧠</div>
          <span className="sidebar-brand-name">
            Brain<span>Check</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section">Overview</span>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            onClick={close}
          >
            <span className="nav-icon">⊞</span> Dashboard
          </NavLink>

          <span className="nav-section">Scans</span>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            onClick={close}
          >
            <span className="nav-icon">⬆</span> Upload MRI
          </NavLink>

          <NavLink
            to="/my-scans"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            onClick={close}
          >
            <span className="nav-icon">🗂</span> My Scans
          </NavLink>

          {isDoctor && (
            <>
              <span className="nav-section">Doctor</span>

              <NavLink
                to="/doctor/scans"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={close}
              >
                <span className="nav-icon">🔬</span> Review Scans
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <span className="nav-section">Admin</span>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={close}
              >
                <span className="nav-icon">⚙</span> Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{initials(user?.name)}</div>

            <div className="user-info">
              <div className="user-name">{user?.name || "User"}</div>
              <div className="user-role">{user?.role || "guest"}</div>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              ⇥
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay ── */}
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={close}
      />

      {/* ── Main Content ── */}
      <div className="main-content">
        {/* ── Topbar (Mobile) ── */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="topbar-icon">🧠</div>
            BrainCheck
          </div>

          <button
            className="hamburger"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {/* ── Page Content ── */}
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;