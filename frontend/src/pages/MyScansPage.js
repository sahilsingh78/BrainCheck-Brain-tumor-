import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Button from "../components/UI/Button";

const MyScansPage = () => {
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const fetchScans = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/scans/my");
        if (!isMounted) return;
        setScans(res.data);
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
  }, []);

  // 🔹 Filtering
  const filtered = scans.filter((s) => {
    if (filter === "tumor") return s.hasTumor;
    if (filter === "clear") return !s.hasTumor;
    if (filter === "pending") return s.status === "pending";
    return true;
  });

  // 🔹 Loading
  if (loading) {
    return (
      <div className="loading-screen" style={{ height: "40vh" }}>
        <div className="spinner" />
        <span>Loading scans...</span>
      </div>
    );
  }

  // 🔹 Error
  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">My Scans</div>
          <div className="page-subtitle">
            {scans.length} total scan{scans.length !== 1 ? "s" : ""} uploaded
          </div>
        </div>

        <Button className="btn-primary" onClick={() => navigate("/upload")}>
          + Upload New
        </Button>
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[
          { key: "all", label: "All Scans" },
          { key: "tumor", label: "⚠ Tumor Detected" },
          { key: "clear", label: "✓ Clear" },
          { key: "pending", label: "⏳ Pending" },
        ].map((f) => (
          <Button
            key={f.key}
            className={`btn-sm ${
              filter === f.key ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* EMPTY */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <h3>No scans found</h3>
          <p>
            {filter === "all"
              ? "Upload your first MRI scan to get started"
              : "No scans match this filter"}
          </p>

          {filter === "all" && (
            <Button
              className="btn-primary"
              onClick={() => navigate("/upload")}
            >
              Upload MRI
            </Button>
          )}
        </div>
      ) : (
        <div className="scans-grid">
          {filtered.map((scan) => (
            <div
              className="scan-card"
              key={scan.id}
              onClick={() => navigate(`/scans/${scan.id}`)}
            >
              {scan.imageData ? (
                <img
                  className="scan-img"
                  src={scan.imageData}
                  alt="MRI"
                />
              ) : (
                <div className="scan-img-placeholder">🧠</div>
              )}

              <div className="scan-body">
                <div className="scan-patient">
                  {scan.patientName || "Unknown"}
                </div>

                <div className="scan-date">
                  {new Date(scan.uploadedAt).toLocaleString()}
                </div>

                <div className="scan-footer">
                  <span
                    className={`badge ${
                      scan.hasTumor
                        ? "badge-tumor"
                        : "badge-no-tumor"
                    }`}
                  >
                    {scan.hasTumor ? "⚠ Tumor" : "✓ Clear"}
                  </span>

                  <span className={`badge badge-${scan.status}`}>
                    {scan.status}
                  </span>
                </div>

                <div className="confidence-bar" style={{ marginTop: 10 }}>
                  <div
                    className="confidence-fill"
                    style={{
                      width: `${scan.confidence || 0}%`,
                      background: scan.hasTumor
                        ? "var(--danger)"
                        : "var(--success)",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-2)",
                    marginTop: 4,
                  }}
                >
                  Confidence: {scan.confidence || 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyScansPage;