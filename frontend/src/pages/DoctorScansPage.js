import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/UI/Button";

const DoctorScansPage = () => {
  const { user, isDoctor, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const fetchScans = async () => {
      if (authLoading) return;

      if (!user || !isDoctor) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await api.get("/admin/scans");

        if (!isMounted) return;

        const data = res.data;

        if (Array.isArray(data)) {
        setScans(data);
        } 
        else if (Array.isArray(data.data)) {
        setScans(data.data);  
        }
        else if (Array.isArray(data.scans)) {
        setScans(data.scans);
        } 
        else {
        console.error("Invalid scans response:", data);
        setScans([]);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load scans");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScans();

    return () => {
      isMounted = false;
    };
  }, [user, isDoctor, authLoading, navigate]);

  const safeScans = Array.isArray(scans) ? scans : [];

  const filtered = safeScans.filter((s) => {
    if (filter === "pending") return s.status === "pending";
    if (filter === "reviewed") return s.status === "reviewed";
    if (filter === "tumor") return !!s.hasTumor;
    return true;
  });

  const pendingCount = safeScans.filter((s) => s.status === "pending").length;

  if (loading || authLoading) {
    return (
      <div className="loading-screen" style={{ height: "40vh" }}>
        <div className="spinner" />
        <span>Loading scans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Button className="btn-secondary" onClick={() => navigate("/dashboard")}>
            Go Back
          </Button>
          <Button className="btn-primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔬 Review Scans</div>
          <div className="page-subtitle">
            {pendingCount} scan{pendingCount !== 1 ? "s" : ""} pending review
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "⏳ Pending" },
          { key: "reviewed", label: "✓ Reviewed" },
          { key: "tumor", label: "⚠ Tumor" },
        ].map((f) => (
          <Button
            key={f.key}
            className={`btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔬</div>
          <h3>No scans to review</h3>
          <p>All caught up!</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Result</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Reviewed By</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((scan) => (
                <tr key={scan.id} onClick={() => navigate(`/scans/${scan.id}`)}>
                  <td style={{ fontWeight: 600 }}>{scan.patientName || "Unknown"}</td>

                  <td>
                    <span className={`badge ${scan.hasTumor ? "badge-tumor" : "badge-no-tumor"}`}>
                      {scan.hasTumor ? "⚠ Tumor" : "✓ Clear"}
                    </span>
                  </td>

                  <td>{scan.confidence || 0}%</td>

                  <td>
                    <span className={`badge badge-${scan.status}`}>{scan.status}</span>
                  </td>

                  <td>
                    {scan.uploadedAt
                      ? new Date(scan.uploadedAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>{scan.reviewedBy || "—"}</td>

                  <td>
                    <Button className="btn-primary btn-sm">
                      {scan.status === "pending" ? "Review →" : "View →"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorScansPage;