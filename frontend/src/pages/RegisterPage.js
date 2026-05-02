import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // 🔹 prevent double submit

    setError("");
    setLoading(true);

    try {
      await register(form.name, form.email, form.password, form.role);
      navigate("/dashboard");
    } catch (err) {
      setError(typeof err === "string" ? err : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: "patient",
      label: "Patient",
      desc: "Upload and view my MRI scans",
      icon: "🙋",
    },
    {
      value: "doctor",
      label: "Doctor",
      desc: "Review and annotate patient scans",
      icon: "👨‍⚕️",
    },
    {
      value: "admin",
      label: "Admin",
      desc: "Manage all users and scans",
      icon: "⚙️",
    },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">🧠</div>
          <span className="auth-brand-name">
            Brain<span>Check</span>
          </span>
        </div>

        <h2>Create account</h2>
        <p className="subtitle">Join the BrainCheck platform</p>

        {/* Error */}
        {error && <div className="alert alert-error">⚠ {error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              type="text"
              className="form-control"
              placeholder="Dr. John Smith"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              className="form-control"
              placeholder="you@hospital.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              className="form-control"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {/* Role selector */}
          <div className="form-group">
            <label>I am a</label>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {roles.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    background:
                      form.role === r.value
                        ? "var(--accent-dim)"
                        : "var(--bg-2)",
                    border: `1px solid ${
                      form.role === r.value
                        ? "rgba(0,212,170,0.3)"
                        : "var(--border-2)"
                    }`,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "var(--t)",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />

                  <span style={{ fontSize: 20 }}>{r.icon}</span>

                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-2)",
                      }}
                    >
                      {r.desc}
                    </div>
                  </div>

                  {form.role === r.value && (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "var(--accent)",
                        fontSize: 16,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 🔥 Button with loader */}
          <Button
            type="submit"
            className="btn-primary btn-full"
            loading={loading}
            style={{ marginTop: 8 }}
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            color: "var(--text-2)",
            fontSize: 13,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;