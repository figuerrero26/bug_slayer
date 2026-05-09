import { FaArrowLeft } from "react-icons/fa";
import "./DashboardTopbar.css";

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

interface Props {
  activeNav: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGoHome: () => void;
  onLogout: () => void;
}

export default function DashboardTopbar({
  activeNav,
  searchQuery,
  onSearchChange,
  onGoHome,
  onLogout,
}: Props) {
  return (
    <header className="topbar topbar-size">
      <h1 className="topbar-title">{SECTION_TITLES[activeNav] ?? "Dashboard"}</h1>
      <div className="topbar-right">
        <div className="search-box-1">
          <span className="search-icon-1">🔍</span>
          <input
            className="search-input-1"
            placeholder="Buscar…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="btn-go-home" onClick={onGoHome} title="Volver al inicio">
          <FaArrowLeft />
          <span>Inicio</span>
        </button>
        <button className="btn-mobile-logout" title="Cerrar sesión" onClick={onLogout}>
          🚪
        </button>
      </div>
    </header>
  );
}
