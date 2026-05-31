import { lazy, Suspense, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import "./Dashboard.css";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { getSession }       from "../hooks/useSession";
import { useDashboard }     from "../hooks/useDashboard";
import { useNotifications } from "../hooks/useNotifications";
import { useLogout }        from "../hooks/useLogout";
import { useLang }          from "../context/LanguageContext";

// ── Layout components ─────────────────────────────────────────────────────────
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardTopbar  from "../components/layout/DashboardTopbar";

// ── UI components ─────────────────────────────────────────────────────────────
import EditProfileModal from "../components/ui/EditProfileModal";
import LogoutOverlay    from "../components/ui/LogoutOverlay";

// ── Views — cargadas bajo demanda (code splitting) ────────────────────────────
const ProfileView     = lazy(() => import("./views/ProfileView"));
const InscritasView   = lazy(() => import("./views/InscritasView"));
const CalendarioView  = lazy(() => import("./views/CalendarioView"));
const PlaceholderView        = lazy(() => import("./views/PlaceholderView"));
const CompletedConferences   = lazy(() => import("./views/CompletedConferences"));
const MessagesView    = lazy(() => import("./views/MessagesView"));
const SettingsView    = lazy(() => import("./views/SettingsView"));

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useLang();

  const [activeNav, setActiveNav]         = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("section") ?? "profile";
  });
  const [showEditModal, setShowEditModal] = useState(false);

  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const session = getSession();
  const userId  = session?.user_id ?? Number(searchParams.get("user_id")) ?? null;

  const { user, confCount, loading, handleUserSaved } = useDashboard(userId, session?.email ?? "");
  const { unreadCount, setUnreadCount }               = useNotifications(userId);
  const { isLoggingOut, handleLogout }                = useLogout();

  const isFirstVisit = useMemo(() => {
    if (!userId) return false;
    const key = `coniiti_visited_${userId}`;
    if (!localStorage.getItem(key)) { localStorage.setItem(key, "1"); return true; }
    return false;
  }, [userId]);

  if (!userId) { navigate("/login"); return null; }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-ring" />
        <p>{t.dash_loading}</p>
      </div>
    );
  }

  const MOBILE_NAV = [
    { id: "profile",     label: t.dash_profile,     emoji: "👤" },
    { id: "conferences", label: t.dash_mobile_talks, emoji: "🎤" },
    { id: "calendar",    label: t.dash_calendar,     emoji: "📅" },
    { id: "favorites",   label: t.dash_favorites,    emoji: "❤️" },
    { id: "messages",    label: t.dash_messages,     emoji: "✉️" },
  ];

  return (
    <>
      {/*
        ┌─────────────────────────────────────────────────────────┐
        │  TOPBAR  (grid-area: topbar — span ambas columnas)      │
        │  [Logo 220px │ Bienvenido de nuevo…  ⚙ 🔔 🌐]         │
        ├──────────────┬──────────────────────────────────────────┤
        │  SIDEBAR     │  CONTENT                                 │
        │  (nav items) │  (vistas)                                │
        └──────────────┴──────────────────────────────────────────┘
      */}
      <div className="dashboard-root">

        {/* Topbar — hijo directo del grid, ocupa ambas columnas */}
        <DashboardTopbar
          activeNav={activeNav}
          user={user}
          unreadCount={unreadCount}
          isFirstVisit={isFirstVisit}
          onGoHome={() => navigate("/")}
          onLogout={handleLogout}
          onNavigate={setActiveNav}
        />

        {/* Sidebar — hijo directo del grid, columna izquierda */}
        <DashboardSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          confCount={confCount}
          unreadCount={unreadCount}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          user={user}
        />

        {/* Content — hijo directo del grid, columna derecha */}
        <main className="main-content">
          <div className="content-area">
            <Suspense fallback={<div className="loading-screen"><div className="loader-ring" /></div>}>
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
                  <ProfileView user={user} onEdit={() => setShowEditModal(true)} userId={userId} />
                )}
                {activeNav === "conferences" && <InscritasView userId={userId} />}
                {activeNav === "calendar"    && <CalendarioView />}
                {activeNav === "favorites" && (
                  <PlaceholderView section={activeNav} />
                )}
                {activeNav === "completed" && (
                  <CompletedConferences userId={userId} />
                )}
                {activeNav === "messages" && (
                  <MessagesView userId={userId} onUnreadChange={setUnreadCount} />
                )}
                {activeNav === "settings" && user && (
                  <SettingsView user={user} onSaved={handleUserSaved} />
                )}
              </motion.div>
            </AnimatePresence>
            </Suspense>
          </div>
        </main>

      </div>

      {/* Bottom nav — solo móvil */}
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
          userId={userId}
          onClose={() => setShowEditModal(false)}
          onSaved={handleUserSaved}
        />
      )}

      {isLoggingOut && user &&
        createPortal(
          <LogoutOverlay initial={user.name.charAt(0).toUpperCase()} />,
          document.body,
        )
      }
    </>
  );
}
