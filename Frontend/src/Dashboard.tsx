import logo_U from "./assets/logo_ucatolica.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import "./css/Dashboard.css";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  birthdate?: string;
  registeredAt?: string;
}

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000/api";

const api = {
  getUser: async (): Promise<User> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("No autorizado");
    return res.json();
  },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USER: User = {
  id: 1,
  name: "Julian David Villegas Fernandez",
  email: "jdvillegas10@ucatolica.edu.co",
  phone: "+57 320 383 5488",
  city: "Bogotá",
  country: "Colombia",
  birthdate: "03/07/2004",
  registeredAt: "10 enero 2024",
};

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "profile",     label: "Perfil"           },
  { id: "conferences", label: "Mis conferencias", badge: 3 },
  { id: "completed",   label: "Completadas",      badge: 0 },
  { id: "events",      label: "Eventos",          badge: 2 },
  { id: "favorites",   label: "Favoritos"         },
  { id: "schedule",    label: "Agenda"            },
  { id: "messages",    label: "Mensajes",         badge: 1 },
];

// ─── EDIT PROFILE MODAL ───────────────────────────────────────────────────────
function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    city: user.city ?? "",
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Perfil</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label>Nombre completo</label>
          <input className="modal-input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>Correo electrónico</label>
          <input className="modal-input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label>Teléfono</label>
          <input className="modal-input" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <label>Ciudad</label>
          <input className="modal-input" value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />

          <label>Nueva contraseña</label>
          <input className="modal-input" type="password"
            placeholder="Dejar vacío para no cambiar" />

          <label>Datos de facturación</label>
          <input className="modal-input" placeholder="NIT / Nombre empresa" />
        </div>
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-modal-save" onClick={onClose}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeNav, setActiveNav] = useState("profile");

  const navigate = useNavigate();

  const USE_MOCK = true; // cambia a false cuando el backend esté listo

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 500));
          setUser(MOCK_USER);
        } else {
          const u = await api.getUser();
          setUser(u);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-ring" />
        <p>Cargando…</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-root">

        {/* ── SIDEBAR ───────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src = {logo_U} alt = "Logo Universidad" className="Logo-U"/>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeNav === item.id ? "nav-active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="nav-icon"></span>
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`nav-badge ${item.badge === 0 ? "badge-zero" : ""}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="btn-logout">
              <span>🚪</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN ──────────────────────────────────────────────── */}
        <main className="main-content">

          {/* Topbar */}
          <header className="topbar topbar-size">
            <h1 className="topbar-title">Perfil</h1>
            <div className="topbar-right">
              <div className="search-box-1">
                <span className="search-icon-1">🔍</span>
                <input className="search-input-1" placeholder="Buscar…" />
              </div>
              <button className="btn-exit" title="Cerrar sesión">↪</button>
            </div>
          </header>

          {/* Content */}
          <div className="content-area">

            {/* ── PROFILE CARD ──────────────────────────────────── */}
            <div className="profile-card">
              <div className="profile-avatar">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <div className="profile-name-row">
                  <h2 className="profile-name">{user?.name}</h2>
                  <button
                    className="btn-edit-icon"
                    onClick={() => setShowEditModal(true)}
                    title="Editar perfil"
                  >✏️</button>
                </div>
                <div className="profile-details">
                  <div className="detail-row">
                    <span className="detail-label">Fecha de registro:</span>
                    <span className="detail-value">{user?.registeredAt}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">País, ciudad:</span>
                    <span className="detail-value">{user?.country}, {user?.city}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fecha de nacimiento:</span>
                    <span className="detail-value">{user?.birthdate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">E-mail:</span>
                    <span className="detail-value">{user?.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Teléfono:</span>
                    <span className="detail-value">{user?.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BOTTOM GRID ───────────────────────────────────── */}
            <div className="bottom-grid">

              {/* Conferencias */}
              <div className="conferences-section">
                <h3 className="section-title">Mis conferencias</h3>
                <div className="conf-list">

                  <div className="conf-item">
                    <div className="conf-timeline">
                      <div className="timeline-dot dot-done" />
                      <div className="timeline-line" />
                    </div>
                    <div className="conf-body">
                      <div className="conf-top">
                        <div>
                          <p className="conf-name">TypeScript Avanzado — Patrones y Performance</p>
                          <p className="conf-sub">Composición, tipos avanzados, rendimiento</p>
                          <p className="conf-meta">15 sesiones</p>
                        </div>
                        <span className="badge-status badge-done">Completada</span>
                      </div>
                    </div>
                  </div>

                  <div className="conf-item">
                    <div className="conf-timeline">
                      <div className="timeline-dot dot-done" />
                      <div className="timeline-line " />
                    </div>
                    <div className="conf-body">
                      <div className="conf-top">
                        <div>
                          <p className="conf-name">FastAPI + Async — Backend Moderno</p>
                          <p className="conf-sub">Diseño de APIs, async/await, autenticación…</p>
                          <p className="conf-meta">12 sesiones</p>
                        </div>
                        <span className="badge-status badge-done">Completada</span>
                      </div>
                    </div>
                  </div>

                  <div className="conf-item">
                    <div className="conf-timeline">
                      <div className="timeline-dot dot-pending" />
                      
                    </div>
                    <div className="conf-body">
                      <div className="conf-top">
                        <div>
                          <p className="conf-name">Microservicios con Docker & Kubernetes</p>
                          <p className="conf-sub">Arquitectura cloud-native de principio a fin…</p>
                          <p className="conf-meta">12 sesiones</p>
                        </div>
                        <span className="badge-status badge-upcoming">Inicio: 05.04.2026</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Columna derecha */}
              <div className="right-column">

                {/* Mis Tickets */}
                <div className="tickets-card">
                  <h3 className="tickets-title">Mis Tickets</h3>
                  <div className="tickets-empty">
                    Aún no has comprado tickets para la conferencia.
                  </div>
                </div>
              
              </div>
            </div>
          </div>
        </main>
      </div>

      {showEditModal && user && (
        <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}