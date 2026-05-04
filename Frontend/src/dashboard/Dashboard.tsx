import logo_U from "../assets/logo_ucatolica.png";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DASHBOARD_URL } from "../config.ts";
import "../css/Dashboard.css";

// ── Vistas internas ────────────────────────────────────────────────────────────
import ProfileView     from "./views/ProfileView.tsx";
import InscritasView   from "./views/InscritasView.tsx";
import CalendarioView  from "./views/CalendarioView.tsx";
import PlaceholderView from "./views/PlaceholderView.tsx";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  birthdate?: string;
  birthdateRaw?: string;
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
function EditProfileModal({
  user,
  userId,
  onClose,
  onSaved,
}: {
  user: User;
  userId: number;
  onClose: () => void;
  onSaved: (updated: Partial<User>) => void;
}) {
  const [form, setForm] = useState({
    name:      user.name,
    phone:     user.phone        ?? "",
    city:      user.city         ?? "",
    birthdate: user.birthdateRaw ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${DASHBOARD_URL}/profile/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:    form.name      || null,
          phone:        form.phone     || null,
          country_city: form.city      || null,
          birth_date:   form.birthdate || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved({
        name:         form.name,
        phone:        form.phone,
        city:         form.city,
        country:      form.city,
        birthdateRaw: form.birthdate,
        birthdate: form.birthdate
          ? new Date(form.birthdate + "T12:00:00").toLocaleDateString("es-CO")
          : "—",
      });
      onClose();
    } catch {
      setError("No se pudo guardar. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>Editar Perfil</h2>
              <p className="modal-subtitle">{user.email}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <hr className="modal-divider" />

        <div className="modal-body">
          <div className="modal-grid">

            <div className="modal-field modal-field--full">
              <label>Nombre completo</label>
              <input className="modal-input" value={form.name} onChange={set("name")} />
            </div>

            <div className="modal-field">
              <label>Teléfono</label>
              <input className="modal-input" type="tel" value={form.phone}
                onChange={set("phone")} placeholder="+57 300 000 0000" />
            </div>

            <div className="modal-field">
              <label>Ciudad / País</label>
              <input className="modal-input" value={form.city}
                onChange={set("city")} placeholder="Bogotá, Colombia" />
            </div>

            <div className="modal-field modal-field--full">
              <label>Fecha de nacimiento</label>
              <input className="modal-input" type="date" value={form.birthdate} onChange={set("birthdate")} />
            </div>

            {error && <p className="modal-error">{error}</p>}

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            className={`btn-modal-save${isSubmitting ? " btn-modal-save--loading" : ""}`}
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser]                   = useState<User | null>(null);
  const [confCount, setConfCount]         = useState(0);
  const [loading, setLoading]             = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeNav, setActiveNav]         = useState("profile");

  const handleUserSaved = (updated: Partial<User>) =>
    setUser((prev) => prev ? { ...prev, ...updated } : prev);

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
          id:           data.user_id,
          name:         data.full_name,
          email:        session?.email ?? "",
          phone:        data.phone,
          city:         data.country_city,
          country:      data.country_city,
          birthdate:    data.birth_date
            ? new Date(data.birth_date).toLocaleDateString("es-CO")
            : "—",
          birthdateRaw: data.birth_date
            ? data.birth_date.substring(0, 10)
            : "",
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
        <EditProfileModal
          user={user}
          userId={userId as number}
          onClose={() => setShowEditModal(false)}
          onSaved={handleUserSaved}
        />
      )}
    </>
  );
}
