import type { ReactNode } from "react";
import {
  FaUser, FaMicrophone, FaCheck, FaCalendar,
  FaHeart, FaCalendarAlt, FaEnvelope, FaCog, FaSignOutAlt,
} from "react-icons/fa";
import { useLang } from "../../context/LanguageContext";
import "./DashboardSidebar.css";

// ── Decoración SVG del sidebar ────────────────────────────────────────────────
// Estilo diferente al header: arcos circulares + curva vertical derecha
function SidebarWaves() {
  return (
    <svg
      className="sb__waves"
      viewBox="0 0 220 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {/* Arco circular grande — esquina superior derecha */}
      <circle cx="240" cy="-20" r="160" fill="#1e6fbd" fillOpacity="0.07" />

      {/* Curva vertical fluida — borde derecho del sidebar */}
      <path
        d="M205,0 C185,120 220,240 200,360 C180,480 220,600 200,720 C190,780 210,800 200,800 L220,800 L220,0 Z"
        fill="#4a90d9"
        fillOpacity="0.09"
      />

      {/* Arco circular mediano — esquina inferior izquierda */}
      <circle cx="-30" cy="820" r="130" fill="#5ba8f5" fillOpacity="0.06" />

      {/* Destellos de luz difusos en el centro */}
      <ellipse cx="110" cy="400" rx="90" ry="60" fill="#1e6fbd" fillOpacity="0.04" />
    </svg>
  );
}

interface NavDef { id: string; icon: ReactNode; badge: boolean; }

const NAV_DEFS: NavDef[] = [
  { id: "profile",     icon: <FaUser />,       badge: false },
  { id: "conferences", icon: <FaMicrophone />,  badge: true  },
  { id: "completed",   icon: <FaCheck />,       badge: false },
  { id: "events",      icon: <FaCalendar />,    badge: false },
  { id: "favorites",   icon: <FaHeart />,       badge: false },
  { id: "calendar",    icon: <FaCalendarAlt />, badge: false },
  { id: "messages",    icon: <FaEnvelope />,    badge: true  },
];

interface Props {
  activeNav:    string;
  setActiveNav: (id: string) => void;
  confCount:    number;
  unreadCount:  number;
  isLoggingOut: boolean;
  onLogout:     () => void;
}

export default function DashboardSidebar({
  activeNav, setActiveNav, confCount, unreadCount, isLoggingOut, onLogout,
}: Props) {
  const { t } = useLang();

  const LABELS: Record<string, string> = {
    profile:     t.dash_profile,
    conferences: t.dash_conferences,
    completed:   t.dash_completed,
    events:      t.dash_events,
    favorites:   t.dash_favorites,
    calendar:    t.dash_calendar,
    messages:    t.dash_messages,
  };

  return (
    <aside className="sb">

      {/* Decoración SVG — absolutas, detrás del contenido */}
      <SidebarWaves />

      {/* BLOQUE 1 — Navegación principal */}
      <nav className="sb__nav">
        {NAV_DEFS.map(({ id, icon, badge }) => {
          const count    = id === "conferences" ? confCount : id === "messages" ? unreadCount : 0;
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              className={`sb__item${isActive ? " sb__item--active" : ""}`}
              onClick={() => setActiveNav(id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="sb__icon" aria-hidden="true">{icon}</span>
              <span className="sb__label">{LABELS[id]}</span>
              {badge && (
                <span className={`sb__badge${count === 0 ? " sb__badge--zero" : ""}`}
                  aria-label={`${count} pendientes`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BLOQUE 2 — Footer (Ajustes + Logout) */}
      <footer className="sb__footer">
        <button
          className={`sb__item${activeNav === "settings" ? " sb__item--active" : ""}`}
          onClick={() => setActiveNav("settings")}
          aria-current={activeNav === "settings" ? "page" : undefined}
        >
          <span className="sb__icon" aria-hidden="true"><FaCog /></span>
          <span className="sb__label">{t.dash_settings}</span>
        </button>

        <button
          className="sb__item sb__item--logout"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
        >
          <span className="sb__icon" aria-hidden="true"><FaSignOutAlt /></span>
          <span className="sb__label">{t.dash_logout}</span>
        </button>
      </footer>

    </aside>
  );
}
