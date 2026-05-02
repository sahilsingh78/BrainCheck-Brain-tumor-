import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";

const AdminPage = () => {
  const { user } = useAuth();

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // 🔹 Fetch all
  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setError("");

      try {
        const [usersRes, scansRes, statsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/scans"),
          api.get("/admin/stats"),
        ]);

        if (!isMounted) return;

        // ✅ FIX: normalize API response
        const usersData = Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.data || [];

        const scansData = Array.isArray(scansRes.data)
          ? scansRes.data
          : scansRes.data?.data || [];

        setUsers(usersData);
        setScans(scansData);
        setStats(statsRes.data || null);

      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load admin data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  // 🔹 Role update
  const handleRoleChange = async (userId, newRole) => {
    if (updating) return;

    setUpdating(userId);

    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, {
        role: newRole,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? data : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  // 🔹 Delete
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all their scans?")) return;

    setDeleting(userId);

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert("Could not delete user");
    } finally {
      setDeleting(null);
    }
  };

  // 🔹 Loading
  if (loading) {
    return (
      <div className="loading-screen" style={{ height: "60vh" }}>
        <div className="spinner" />
        <span>Loading admin data...</span>
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
          <div className="page-title">⚙ Admin Panel</div>
          <div className="page-subtitle">
            Manage users, roles, and all scans
          </div>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          {[
            { icon: "👥", label: "Users", value: stats.totalUsers },
            { icon: "👨‍⚕️", label: "Doctors", value: stats.totalDoctors },
            { icon: "🙋", label: "Patients", value: stats.totalPatients },
            { icon: "🧠", label: "Scans", value: stats.totalScans },
            { icon: "⚠️", label: "Tumor", value: stats.tumorDetected },
            { icon: "⏳", label: "Pending", value: stats.pendingReview },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <Button
          className={tab === "users" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("users")}
        >
          👥 Users ({users.length})
        </Button>

        <Button
          className={tab === "scans" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("scans")}
        >
          🧠 Scans ({scans.length})
        </Button>
      </div>

      {/* USERS */}
      {tab === "users" && (
        <div className="table-wrap">
          <table>
            <tbody>
              {Array.isArray(users) &&
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.id !== user.id && (
                        <Button
                          className="btn-danger btn-sm"
                          loading={deleting === u.id}
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SCANS */}
      {tab === "scans" && (
        <div className="table-wrap">
          <table>
            <tbody>
              {Array.isArray(scans) &&
                scans.map((s) => (
                  <tr key={s.id}>
                    <td>{s.patientName}</td>
                    <td>{s.confidence}%</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;