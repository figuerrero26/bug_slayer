import type { ReactNode } from "react";
import {
  Home, CalendarDays, CheckSquare,
  Heart, Calendar, Mail, LogOut, ChevronRight,
} from "lucide-react";
import { useLang } from "../../context/LanguageContext";
import type { User } from "../../interfaces/user";
import "./DashboardSidebar.css";

// ── Decoración SVG del sidebar ────────────────────────────────────────────────
function SidebarWaves() {
  return (
    <svg
      className="sb__waves"
      viewBox="0 0 220 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="240" cy="-20" r="160" fill="#1e6fbd" fillOpacity="0.07" />
      <path
        d="M205,0 C185,120 220,240 200,360 C180,480 220,600 200,720 C190,780 210,800 200,800 L220,800 L220,0 Z"
        fill="#4a90d9" fillOpacity="0.09"
      />
      <circle cx="-30" cy="820" r="130" fill="#5ba8f5" fillOpacity="0.06" />
      <ellipse cx="110" cy="400" rx="90" ry="60" fill="#1e6fbd" fillOpacity="0.04" />
    </svg>
  );
}

interface NavDef { id: string; icon: ReactNode; badge: boolean; }

const NAV_DEFS: NavDef[] = [
  { id: "profile",     icon: <Home        size={18} strokeWidth={2} />, badge: false },
  { id: "conferences", icon: <CalendarDays size={18} strokeWidth={2} />, badge: false },
  { id: "completed",   icon: <CheckSquare  size={18} strokeWidth={2} />, badge: false },
  { id: "favorites",   icon: <Heart        size={18} strokeWidth={2} />, badge: false },
  { id: "calendar",    icon: <Calendar     size={18} strokeWidth={2} />, badge: false },
  { id: "messages",    icon: <Mail         size={18} strokeWidth={2} />, badge: true  },
];

interface Props {
  activeNav:    string;
  setActiveNav: (id: string) => void;
  confCount:    number;
  unreadCount:  number;
  isLoggingOut: boolean;
  onLogout:     () => void;
  user:         User | null;
}

export default function DashboardSidebar({
  activeNav, setActiveNav, confCount, unreadCount, isLoggingOut, onLogout, user,
}: Props) {
  const { t } = useLang();

  const LABELS: Record<string, string> = {
    profile:     t.dash_profile,
    conferences: t.dash_conferences,
    completed:   t.dash_completed,
    favorites:   t.dash_favorites,
    calendar:    t.dash_calendar,
    messages:    t.dash_messages,
  };

  return (
    <aside className="sb">

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
                <span
                  className={`sb__badge${count === 0 ? " sb__badge--zero" : ""}`}
                  aria-label={`${count} pendientes`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BLOQUE 2 — Footer: sección "Cuenta" */}
      <footer className="sb__footer">

        {/* Etiqueta de sección */}
        <span className="sb__section-label">{t.dash_section_account}</span>

        {/* Tarjeta de perfil → Ajustes */}
        <button
          className={`sb__profile${activeNav === "settings" ? " sb__profile--active" : ""}`}
          onClick={() => setActiveNav("settings")}
          aria-current={activeNav === "settings" ? "page" : undefined}
        >
          <div className="sb__avatar" aria-hidden="true">
            <span className="sb__avatar-initial">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="sb__profile-info">
            <span className="sb__profile-name">
              {user?.name?.split(" ").slice(0, 2).join(" ") ?? ""}
            </span>
            <span className="sb__profile-sub">{t.dash_account_settings}</span>
          </div>
          <ChevronRight size={14} strokeWidth={2} className="sb__profile-chevron" aria-hidden="true" />
        </button>

        {/* Cerrar sesión */}
        <button
          className="sb__item sb__item--logout"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
        >
          <span className="sb__icon" aria-hidden="true">
            <LogOut size={18} strokeWidth={2} />
          </span>
          <span className="sb__label">{t.dash_logout}</span>
        </button>

      </footer>

    </aside>
  );
}
