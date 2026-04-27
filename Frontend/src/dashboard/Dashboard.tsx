import logo_U from "../assets/logo_ucatolica.png";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DASHBOARD_URL } from "../config";
import "../css/Dashboard.css";

// ── Vistas internas ────────────────────────────────────────────────────────────
import ProfileView     from "./views/ProfileView";
import InscritasView   from "./views/InscritasView";
import CalendarioView  from "./views/CalendarioView";
import PlaceholderView from "./views/PlaceholderView";

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
  conferences: unknown[];
}

// ─── SESSION HELPER ────────────────────────────────────────────────────────────
function getSession(): { token: string; user_id: number; email: string } | null {
  try {
    const raw = sessionStorage.getItem("session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────
// "Agenda" reemplazada por "Calendario" (id: "calendar")
const NAV_ITEMS = [
  { id: "profile",     label: "Perfil"                        },
  { id: "conferences", label: "Mis conferencias", badge: true },
  { id: "completed",   label: "Completadas",      badge: false},
  { id: "events",      label: "Eventos",          badge: false},
  { id: "favorites",   label: "Favoritos"                     },
  { id: "calendar",    label: "Calendario"                    },
  { id: "messages",    label: "Mensajes",         badge: false},
];

// Título del topbar según sección activa
const SECTION_TITLES: Record<string, string> = {
  profile:     "Perfil",
  conferences: "Mis Conferencias",
  completed:   "Completadas",
  events:      "Eventos",
  favorites:   "Favoritos",
  calendar:    "Calendario",
  messages:    "Mensajes",
};

// ─── EDIT PROFILE MODAL ────────────────────────────────────────────────────────
function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [form, setForm] = useState({
    name:  user.name,
    email: user.email,
    phone: user.phone ?? "",
    city:  user.city  ?? "",
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
          <button className="btn-modal-save"   onClick={onClose}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser]             = useState<User | null>(null);
  const [confCount, setConfCount]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeNav, setActiveNav]   = useState("profile");

  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  // user_id: sessionStorage tiene prioridad; ?user_id=1 sirve para pruebas directas
  const session = getSession();
  const userId  = session?.user_id ?? Number(searchParams.get("user_id")) ?? null;

  const handleLogout = () => {
    sessionStorage.removeItem("session");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // El botón ↪ regresa al home sin borrar la sesión:
  // Inscripciones.tsx detecta sessionStorage automáticamente
  const handleGoHome = () => navigate("/");

  // ── Carga del perfil desde dashboard_service ────────────────────────────────
  useEffect(() => {
    if (!userId) { navigate("/login"); return; }

    fetch(`${DASHBOARD_URL}/dashboard/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el dashboard");
        return res.json() as Promise<DashboardData>;
      })
      .then((data) => {
        setUser({
          id:          data.user_id,
          name:        data.full_name,
          email:       session?.email ?? "",
          phone:       data.phone,
          city:        data.country_city,
          country:     data.country_city,
          birthdate:   data.birth_date
            ? new Date(data.birth_date).toLocaleDateString("es-CO")
            : "—",
          registeredAt: data.registered_at
            ? new Date(data.registered_at).toLocaleString("es-CO", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "—",
        });
        setConfCount(data.conferences.length);
      })
      .catch((err) => console.error("[Dashboard]", err))
      .finally(() => setLoading(false));
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

        {/* ── SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src={logo_U} alt="Logo Universidad" className="Logo-U" />
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const badgeCount = item.id === "conferences" ? confCount : 0;
              const showBadge  = item.badge !== undefined;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeNav === item.id ? "nav-active" : ""}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span className="nav-icon" />
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
            <button className="btn-logout" onClick={handleLogout}>
              <span>🚪</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────── */}
        <main className="main-content">

          {/* Topbar */}
          <header className="topbar topbar-size">
            <h1 className="topbar-title">{SECTION_TITLES[activeNav] ?? "Dashboard"}</h1>
            <div className="topbar-right">
              <div className="search-box-1">
                <span className="search-icon-1">🔍</span>
                <input className="search-input-1" placeholder="Buscar…" />
              </div>
              <button className="btn-exit" title="Ir a inicio" onClick={handleGoHome}>↪</button>
            </div>
          </header>

          {/* ── Área de contenido — cambia según la sección activa ── */}
          <div className="content-area">

            {activeNav === "profile" && user && (
              <ProfileView user={user} onEdit={() => setShowEditModal(true)} />
            )}

            {activeNav === "conferences" && userId && (
              <InscritasView userId={userId} />
            )}

            {activeNav === "calendar" && (
              <CalendarioView />
            )}

            {(activeNav === "favorites" ||
              activeNav === "events"    ||
              activeNav === "completed" ||
              activeNav === "messages") && (
              <PlaceholderView section={activeNav} />
            )}

          </div>
        </main>
      </div>

      {showEditModal && user && (
        <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}
