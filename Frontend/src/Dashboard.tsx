import logo_U from "./assets/logo_ucatolica.png";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import { DASHBOARD_URL } from "./config";
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

interface Conference {
  id: number;
  title: string;
  speaker_name: string | null;
  speaker_image_url: string | null;
  category: string | null;
  schedule: string | null;
  location_text: string | null;
  registration_id: number;
  registration_status: string;
}

interface DashboardData {
  user_id: number;
  full_name: string;
  birth_date: string | null;
  country_city: string;
  phone: string;
  photo_url: string | null;
  registered_at: string | null; 
  completed_events: number;
  pending_events: number;
  unread_messages: number;
  conferences: Conference[];
}

// ─── SESSION HELPER ───────────────────────────────────────────────────────────
// Usa la misma clave "session" que Login.tsx e Inscripciones.tsx
function getSession(): { token: string; user_id: number; email: string } | null {
  try {
    const raw = sessionStorage.getItem("session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "profile",     label: "Perfil"                         },
  { id: "conferences", label: "Mis conferencias", badge: true  },
  { id: "completed",   label: "Completadas",      badge: false },
  { id: "events",      label: "Eventos",          badge: false },
  { id: "favorites",   label: "Favoritos"                      },
  { id: "schedule",    label: "Agenda"                         },
  { id: "messages",    label: "Mensajes",         badge: false },
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
  const [user, setUser]               = useState<User | null>(null);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeNav, setActiveNav]     = useState("profile");

  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();

  // Resolución del user_id: sessionStorage tiene prioridad sobre el param de URL.
  // El param ?user_id=1 sirve para pruebas mientras auth_service no esté integrado.
  const session = getSession();
  const userId  = session?.user_id ?? Number(searchParams.get("user_id")) ?? null;

  // ── Cerrar sesión: limpia almacenamiento y redirige a login ────────────────
  const handleLogout = () => {
    sessionStorage.removeItem("session");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Ir a Home: la sesión permanece en sessionStorage, Inscripciones.tsx
  //    la detecta automáticamente para validar el acceso a inscripciones. ────
  const handleGoHome = () => {
    navigate("/");
  };

  // ── Carga de datos desde dashboard_service ────────────────────────────────
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        // Un solo fetch al dashboard_service que consolida perfil + stats + conferencias
        const res = await fetch(`${DASHBOARD_URL}/dashboard/${userId}`);
        if (!res.ok) throw new Error("No se pudo cargar el dashboard");

        const data: DashboardData = await res.json();

        setUser({
          id:           data.user_id,
          name:         data.full_name,
          email:        session?.email ?? "",
          phone:        data.phone,
          city:         data.country_city,
          country:      data.country_city,
          birthdate:    data.birth_date
            ? new Date(data.birth_date).toLocaleDateString("es-CO")
            : "—",
            
          registeredAt: data.registered_at
            ? new Date(data.registered_at).toLocaleString("es-CO", {
                day: "2-digit", 
                month: "short", 
                year: "numeric",
                hour: "2-digit", 
                minute: "2-digit"
              })
            : "—",
        });

        setConferences(data.conferences);
      } catch (err) {
        console.error("[Dashboard] Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [userId]);

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
            <img src={logo_U} alt="Logo Universidad" className="Logo-U" />
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              // El badge de conferencias refleja el total real de inscripciones
              const badgeCount =
                item.id === "conferences" ? conferences.length : 0;
              const showBadge = item.badge !== undefined;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeNav === item.id ? "nav-active" : ""}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span className="nav-icon"></span>
                  <span className="nav-label">{item.label}</span>
                  {showBadge && (
                    <span className={`nav-badge ${badgeCount === 0 ? "badge-zero" : ""}`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            {/* Cierra sesión: limpia sessionStorage y redirige a /login */}
            <button className="btn-logout" onClick={handleLogout}>
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
              {/* Vuelve al home conservando la sesión activa */}
              <button className="btn-exit" title="Ir a inicio" onClick={handleGoHome}>↪</button>
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
                    <span className="detail-value">{user?.country}</span>
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

                  {conferences.length === 0 ? (
                    <p style={{ color: "var(--muted, #888)", fontSize: "0.9rem", padding: "0.5rem 0" }}>
                      Aún no tienes conferencias inscritas.
                    </p>
                  ) : (
                    conferences.map((conf, i) => {
                      const isPast = conf.schedule
                        ? new Date(conf.schedule) < new Date()
                        : false;
                      const isLast = i === conferences.length - 1;

                      return (
                        <div key={conf.id} className="conf-item">
                          <div className="conf-timeline">
                            <div className={`timeline-dot ${isPast ? "dot-done" : "dot-pending"}`} />
                            {!isLast && <div className="timeline-line" />}
                          </div>
                          <div className="conf-body">
                            <div className="conf-top">
                              <div>
                                <p className="conf-name">{conf.title}</p>
                                {conf.speaker_name && (
                                  <p className="conf-sub">{conf.speaker_name}</p>
                                )}
                                {conf.location_text && (
                                  <p className="conf-meta">{conf.location_text}</p>
                                )}
                              </div>
                              <span className={`badge-status ${isPast ? "badge-done" : "badge-upcoming"}`}>
                                {isPast
                                  ? "Completada"
                                  : conf.schedule
                                    ? new Date(conf.schedule).toLocaleDateString("es-CO", {
                                        day: "2-digit", month: "short", year: "numeric",
                                      })
                                    : "Por definir"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

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
