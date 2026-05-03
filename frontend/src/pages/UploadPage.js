import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const UploadPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(f.type)) {
      setError("Only PNG, JPG, JPEG, WEBP images are accepted");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select an MRI image");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);
    if (patientName) formData.append("patientName", patientName);
    if (notes) formData.append("notes", notes);

    try {
      const { data } = await api.post("/scans/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ================= RESULT SCREEN =================
  if (result) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Analysis Complete</div>
            <div className="page-subtitle">
              Deep Learning-based brain tumor detection (CNN + Attention Mechanism)
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 800 }}>

          {/* MRI Image */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>MRI Scan</div>
            <img
              src={result.imageData}
              alt="MRI scan"
              style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>

          {/* Result */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div className={`result-box ${result.hasTumor ? "tumor" : "no-tumor"}`}>
              <div className="result-icon">{result.hasTumor ? "⚠️" : "✅"}</div>
              <div className="result-label"
                style={{ color: result.hasTumor ? "var(--danger)" : "var(--success)" }}>
                {result.result}
              </div>
              <div className="result-confidence">
                DL Model Confidence: {result.confidence}%
              </div>
              {result.note && (
                <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>{result.note}</div>
              )}
            </div>

            {/* Confidence bar */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Confidence Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="confidence-bar" style={{ flex: 1 }}>
                  <div className="confidence-fill" style={{
                    width: `${result.confidence}%`,
                    background: result.hasTumor ? "var(--danger)" : "var(--success)"
                  }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{result.confidence}%</span>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Scan Details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-2)" }}>
                <span>Patient: <strong style={{ color: "var(--text)" }}>{result.patientName}</strong></span>
                <span>Status: <span className={`badge badge-${result.status}`}>{result.status}</span></span>
                <span>Date: {new Date(result.uploadedAt).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => { setResult(null); setFile(null); setPreview(null); }}>
                Upload Another
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => navigate(`/scans/${result.id}`)}>
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= UPLOAD SCREEN =================
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Upload MRI Scan</div>
          <div className="page-subtitle">
            Deep Learning-based brain tumor detection system
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>

        {/* Upload zone */}
        <div>
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview"
                style={{ maxHeight: 200, borderRadius: 8, marginBottom: 12 }} />
            ) : (
              <span className="upload-zone-icon">🧠</span>
            )}
            <h3>{file ? file.name : "Drop your MRI scan here"}</h3>
            <p>{file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse — PNG, JPG, JPEG, WEBP"}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Scan Information</div>

            <div className="form-group">
              <label>Patient Name (optional)</label>
              <input className="form-control"
                placeholder="Leave blank to use your account name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea className="form-control"
                placeholder="Any relevant clinical notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div style={{
              background: "var(--accent-dim)",
              border: "1px solid rgba(0,212,170,0.15)",
              borderRadius: 8, padding: "12px 14px",
              fontSize: 13, color: "var(--text-2)", marginBottom: 20
            }}>
              🧠 Deep Learning model (CNN + Attention Mechanism) will analyze this MRI.
            </div>

            <button type="submit" className="btn btn-primary btn-full"
              disabled={loading || !file}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</>
              ) : (
                "Run Analysis"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;