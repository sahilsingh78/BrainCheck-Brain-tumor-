import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const DashboardPage = () => {
  const { user, isAdmin, isDoctor } = useAuth();
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        if (isAdmin) {
          const [statsRes, scansRes] = await Promise.all([
            api.get("/admin/stats"),
            api.get("/admin/scans"),
          ]);

          if (!isMounted) return;

          setAdminStats(statsRes.data);

          const scansData = Array.isArray(scansRes.data)
            ? scansRes.data
            : scansRes.data.data || scansRes.data.scans || [];

          setScans(scansData.slice(0, 5));
        } else {
          const res = await api.get("/scans/my");

          if (!isMounted) return;

          const scansData = Array.isArray(res.data)
            ? res.data
            : res.data.data || res.data.scans || [];

          setScans(scansData.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load dashboard data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const safeScans = Array.isArray(scans) ? scans : [];

  const tumorCount = safeScans.filter((s) => s.hasTumor).length;
  const pendingCount = safeScans.filter((s) => s.status === "pending").length;

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: "60vh" }}>
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
          </div>

          <div className="page-subtitle">
            {isAdmin
              ? "Admin Overview"
              : isDoctor
              ? "Doctor Dashboard"
              : "Your MRI dashboard"}
          </div>
        </div>

        <Link to="/upload" className="btn btn-primary">
          + Upload MRI
        </Link>
      </div>

      {!isAdmin && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{safeScans.length}</div>
            <div className="stat-label">Total Scans</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{tumorCount}</div>
            <div className="stat-label">Tumor Detected</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Recent Scans</h3>

        {safeScans.length === 0 ? (
          <p>No scans yet</p>
        ) : (
          <table>
            <tbody>
              {safeScans.map((scan) => (
                <tr key={scan.id} onClick={() => navigate(`/scans/${scan.id}`)}>
                  <td>{scan.patientName}</td>
                  <td>{scan.hasTumor ? "Tumor" : "Clear"}</td>
                  <td>{scan.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;