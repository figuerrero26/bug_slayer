import logo_U from "../../assets/escudo-ucatolica.png";
import { FaCog } from "react-icons/fa";
import "./DashboardSidebar.css";

const NAV_ITEMS = [
  { id: "profile",     label: "Perfil"                         },
  { id: "conferences", label: "Mis conferencias", badge: true  },
  { id: "completed",   label: "Completadas",      badge: false },
  { id: "events",      label: "Eventos",          badge: false },
  { id: "favorites",   label: "Favoritos"                      },
  { id: "calendar",    label: "Calendario"                     },
  { id: "messages",    label: "Mensajes",         badge: true  },
  { id: "settings",    label: "Ajustes"                        },
];

interface Props {
  activeNav: string;
  setActiveNav: (id: string) => void;
  confCount: number;
  unreadCount: number;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export default function DashboardSidebar({
  activeNav,
  setActiveNav,
  confCount,
  unreadCount,
  isLoggingOut,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo_U} alt="Escudo Universidad" className="Logo-U" />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const badgeCount =
            item.id === "conferences" ? confCount :
            item.id === "messages"    ? unreadCount : 0;
          const showBadge = item.badge !== undefined;

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
        <button className="btn-logout" onClick={onLogout} disabled={isLoggingOut}>
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
