import logo_U from "../assets/escudo-ucatolica.png";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaCog } from "react-icons/fa";

import { DASHBOARD_URL, NOTIFICATIONS_URL } from "../config.ts";
import "../css/Dashboard.css";

// ── Vistas internas ────────────────────────────────────────────────────────────
import ProfileView     from "./views/ProfileView.tsx";
import InscritasView   from "./views/InscritasView.tsx";
import CalendarioView  from "./views/CalendarioView.tsx";
import PlaceholderView from "./views/PlaceholderView.tsx";
import MessagesView    from "./views/MessagesView.tsx";
import SettingsView    from "./views/SettingsView.tsx";

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
const NAV_ITEMS = [
  { id: "profile",     label: "Perfil"                        },
  { id: "conferences", label: "Mis conferencias", badge: true },
  { id: "completed",   label: "Completadas",      badge: false},
  { id: "events",      label: "Eventos",          badge: false},
  { id: "favorites",   label: "Favoritos"                     },
  { id: "calendar",    label: "Calendario"                    },
  { id: "messages",    label: "Mensajes",         badge: true },
  { id: "settings",   label: "Ajustes"                       },
];

// Ítems del bottom nav en móvil (los 5 más importantes)
const MOBILE_NAV = [
  { id: "profile",     label: "Perfil",        emoji: "👤" },
  { id: "conferences", label: "Mis charlas",   emoji: "🎤" },
  { id: "calendar",    label: "Calendario",    emoji: "📅" },
  { id: "favorites",   label: "Favoritos",     emoji: "❤️" },
  { id: "messages",    label: "Mensajes",      emoji: "✉️" },
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
  settings:    "Ajustes",
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
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeNav, setActiveNav]         = useState("profile");
  const [searchQuery, setSearchQuery]     = useState("");
  const [isLoggingOut, setIsLoggingOut]   = useState(false);

  const handleUserSaved = (updated: Partial<User>) =>
    setUser((prev) => prev ? { ...prev, ...updated } : prev);

  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  // user_id: sessionStorage tiene prioridad; ?user_id=1 sirve para pruebas directas
  const session = getSession();
  const userId  = session?.user_id ?? Number(searchParams.get("user_id")) ?? null;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      sessionStorage.removeItem("session");
      localStorage.removeItem("token");
      navigate("/login");
    }, 2800);
  };

  // El botón ↪ regresa al home sin borrar la sesión:
  // Inscripciones.tsx detecta sessionStorage automáticamente
  const handleGoHome = () => navigate("/");

  // ── Unread messages count (badge en sidebar) ──────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch(`${NOTIFICATIONS_URL}/notifications/unread/${userId}`)
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unread_count ?? 0))
      .catch(() => {});
  }, [userId]);

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
            <img src={logo_U} alt="Escudo Universidad" className="Logo-U" />
            
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const badgeCount = item.id === "conferences" ? confCount
                               : item.id === "messages"    ? unreadCount
                               : 0;
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
            <button
              className="nav-item"
              onClick={() => setActiveNav("settings")}
              style={{ marginBottom: "4px" }}
            >
              <FaCog style={{ fontSize: 15, flexShrink: 0 }} />
              <span className="nav-label">Ajustes</span>
            </button>
            <button className="btn-logout" onClick={handleLogout} disabled={isLoggingOut}>
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
                <input
                  className="search-input-1"
                  placeholder="Buscar…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn-go-home" onClick={handleGoHome} title="Volver al inicio">
                <FaArrowLeft />
                <span>Inicio</span>
              </button>
              <button className="btn-mobile-logout" title="Cerrar sesión" onClick={handleLogout}>🚪</button>
            </div>
          </header>

          {/* ── Área de contenido con transiciones ── */}
          <div className="content-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{    opacity: 0, y: -6  }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: "20px" }}
              >
                {activeNav === "profile" && user && (
                  <ProfileView user={user} onEdit={() => setShowEditModal(true)} userId={userId as number} />
                )}
                {activeNav === "conferences" && userId && (
                  <InscritasView userId={userId} searchQuery={searchQuery} />
                )}
                {activeNav === "calendar" && <CalendarioView />}
                {(activeNav === "favorites" || activeNav === "events" || activeNav === "completed") && (
                  <PlaceholderView section={activeNav} />
                )}
                {activeNav === "messages" && userId && (
                  <MessagesView userId={userId} onUnreadChange={setUnreadCount} searchQuery={searchQuery} />
                )}
                {activeNav === "settings" && user && (
                  <SettingsView user={user} onSaved={handleUserSaved} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV — solo móvil ──────────────────────────────── */}
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(({ id, label, emoji }) => (
          <button
            key={id}
            className={`mobile-nav-btn ${activeNav === id ? "mobile-nav-active" : ""}`}
            onClick={() => setActiveNav(id)}
          >
            <span className="mobile-nav-emoji">{emoji}</span>
            <span className="mobile-nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {showEditModal && user && (
        <EditProfileModal
          user={user}
          userId={userId as number}
          onClose={() => setShowEditModal(false)}
          onSaved={handleUserSaved}
        />
      )}

      {isLoggingOut && user &&
        createPortal(
          <DashboardLogoutOverlay initial={user.name.charAt(0).toUpperCase()} />,
          document.body
        )
      }
    </>
  );
}

// ── Logout Overlay ────────────────────────────────────────────────────────────
const LOGOUT_MESSAGES = [
  "Cerrando sesión de forma segura...",
  "Limpiando datos de sesión...",
  "Todo listo. ¡Hasta pronto!",
];
const LOGOUT_DURATION_MS = 1000;

function DashboardLogoutOverlay({ initial }: { initial: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => Math.min(i + 1, LOGOUT_MESSAGES.length - 1)),
      LOGOUT_DURATION_MS / LOGOUT_MESSAGES.length,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="dash-logout-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        className="dash-logout-center"
        initial={{ scale: 0.88, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="dash-logout-avatar-wrap">
          <div className="dash-logout-spinner" />
          <div className="dash-logout-letter">{initial}</div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            className="dash-logout-msg"
            initial={{ opacity: 0, y: 8  }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {LOGOUT_MESSAGES[idx]}
          </motion.p>
        </AnimatePresence>
        <div className="dash-logout-bar">
          <motion.div
            className="dash-logout-bar-fill"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: LOGOUT_DURATION_MS / 1000, ease: "linear" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
