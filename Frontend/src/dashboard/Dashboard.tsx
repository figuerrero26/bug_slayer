import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import "./Dashboard.css";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { getSession }       from "../hooks/useSession";
import { useDashboard }     from "../hooks/useDashboard";
import { useNotifications } from "../hooks/useNotifications";
import { useLogout }        from "../hooks/useLogout";

// ── Layout components ─────────────────────────────────────────────────────────
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardTopbar  from "../components/layout/DashboardTopbar";

// ── UI components ─────────────────────────────────────────────────────────────
import EditProfileModal from "../components/ui/EditProfileModal";
import LogoutOverlay    from "../components/ui/LogoutOverlay";

// ── Views ─────────────────────────────────────────────────────────────────────
import ProfileView     from "./views/ProfileView";
import InscritasView   from "./views/InscritasView";
import CalendarioView  from "./views/CalendarioView";
import PlaceholderView from "./views/PlaceholderView";
import MessagesView    from "./views/MessagesView";
import SettingsView    from "./views/SettingsView";

// ── Constants ─────────────────────────────────────────────────────────────────
const MOBILE_NAV = [
  { id: "profile",     label: "Perfil",      emoji: "👤" },
  { id: "conferences", label: "Mis charlas", emoji: "🎤" },
  { id: "calendar",    label: "Calendario",  emoji: "📅" },
  { id: "favorites",   label: "Favoritos",   emoji: "❤️" },
  { id: "messages",    label: "Mensajes",    emoji: "✉️" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav]         = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("section") ?? "profile";
  });
  const [searchQuery, setSearchQuery]     = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const session = getSession();
  const userId  = session?.user_id ?? Number(searchParams.get("user_id")) ?? null;

  const { user, confCount, loading, handleUserSaved } = useDashboard(userId, session?.email ?? "");
  const { unreadCount, setUnreadCount }               = useNotifications(userId);
  const { isLoggingOut, handleLogout }                = useLogout();

  const handleGoHome = () => navigate("/");

  if (!userId) { navigate("/login"); return null; }

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

        <DashboardSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          confCount={confCount}
          unreadCount={unreadCount}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />

        <main className="main-content">
          <DashboardTopbar
            activeNav={activeNav}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onGoHome={handleGoHome}
            onLogout={handleLogout}
          />

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
                  <ProfileView user={user} onEdit={() => setShowEditModal(true)} userId={userId} />
                )}
                {activeNav === "conferences" && (
                  <InscritasView userId={userId} searchQuery={searchQuery} />
                )}
                {activeNav === "calendar" && <CalendarioView />}
                {(activeNav === "favorites" || activeNav === "events" || activeNav === "completed") && (
                  <PlaceholderView section={activeNav} />
                )}
                {activeNav === "messages" && (
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
