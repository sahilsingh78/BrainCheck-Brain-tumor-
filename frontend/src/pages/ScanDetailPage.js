import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/UI/Button";

const ScanDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDoctor } = useAuth();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // 🔹 Fetch scan
  useEffect(() => {
    let isMounted = true;

    const fetchScan = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/scans/${id}`);
        if (!isMounted) return;

        setScan(res.data);
        setNotes(res.data.notes || "");
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load scan");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScan();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // 🔹 Review
  const handleReview = async () => {
    if (reviewing) return;

    setReviewing(true);
    setReviewSuccess(false);

    try {
      const { data } = await api.put(`/scans/${id}/review`, { notes });
      setScan(data);
      setReviewSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save review");
    } finally {
      setReviewing(false);
    }
  };

  // 🔹 Loading
  if (loading) {
    return (
      <div className="loading-screen" style={{ height: "60vh" }}>
        <div className="spinner" />
        <span>Loading scan...</span>
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
        <Button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </Button>
      </div>
    );
  }

  // 🔹 Not found
  if (!scan) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🧠</div>
        <h3>Scan not found</h3>
        <Button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Button
            className="btn-secondary btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>

          <div>
            <div className="page-title">Scan Analysis</div>
            <div className="page-subtitle">
              Patient: {scan.patientName || "Unknown"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <span
            className={`badge ${
              scan.hasTumor ? "badge-tumor" : "badge-no-tumor"
            }`}
          >
            {scan.hasTumor ? "⚠ Tumor" : "✓ Clear"}
          </span>

          <span className={`badge badge-${scan.status}`}>
            {scan.status}
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* IMAGE */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 14 }}>
            MRI Scan Image
          </div>

          {scan.imageData ? (
            <img
              src={scan.imageData}
              alt="MRI"
              style={{ width: "100%", borderRadius: 10 }}
            />
          ) : (
            <div className="scan-img-placeholder">🧠</div>
          )}
        </div>

        {/* DETAILS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* RESULT */}
          <div
            className={`result-box ${
              scan.hasTumor ? "tumor" : "no-tumor"
            }`}
          >
            <div className="result-icon">
              {scan.hasTumor ? "⚠️" : "✅"}
            </div>

            <div className="result-label">{scan.result}</div>

            <div className="result-confidence">
              AI Confidence: {scan.confidence || 0}%
            </div>
          </div>

          {/* CONFIDENCE */}
          <div className="card">
            <div style={{ fontWeight: 600 }}>Confidence Score</div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="confidence-bar" style={{ flex: 1 }}>
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

              <span style={{ fontWeight: 700 }}>
                {scan.confidence || 0}%
              </span>
            </div>
          </div>

          {/* DETAILS */}
          <div className="card">
            <div style={{ fontWeight: 700 }}>Details</div>

            {[
              ["Patient", scan.patientName],
              ["Uploaded", new Date(scan.uploadedAt).toLocaleString()],
              ["Reviewed by", scan.reviewedBy || "Not reviewed"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          {/* DOCTOR */}
          {isDoctor && (
            <div className="card">
              <div style={{ fontWeight: 700 }}>Doctor Notes</div>

              {reviewSuccess && (
                <div className="alert alert-success">
                  ✓ Review saved
                </div>
              )}

              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Button
                className="btn-primary btn-full"
                loading={reviewing}
                onClick={handleReview}
              >
                Save Review
              </Button>
            </div>
          )}

          {/* PATIENT */}
          {!isDoctor && scan.notes && (
            <div className="card">
              <div style={{ fontWeight: 700 }}>
                Doctor's Notes
              </div>

              <p>{scan.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanDetailPage;