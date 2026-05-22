import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaCog, FaBell } from "react-icons/fa";
import ReactCountryFlag from "react-country-flag";
import logo_U from "../../assets/escudo-ucatolica.png";
import { useLang, LANGUAGES, LangCode } from "../../context/LanguageContext";
import "./DashboardTopbar.css";

import type { User } from "../../interfaces/user";

const LANG_TO_COUNTRY: Record<LangCode, string> = {
  ES: "ES", EN: "US", IT: "IT", PT: "BR", FR: "FR",
};

interface Props {
  activeNav:    string;
  user:         User | null;
  unreadCount:  number;
  isFirstVisit: boolean;
  onGoHome:     () => void;
  onLogout:     () => void;
  onNavigate:   (section: string) => void;
}

// ── Bandera circular ──────────────────────────────────────────────────────────
function CircleFlag({ langCode, size = 28 }: { langCode: LangCode; size?: number }) {
  return (
    <span className="tb-flag-circle" style={{ width: size, height: size }}>
      <ReactCountryFlag
        countryCode={LANG_TO_COUNTRY[langCode]}
        svg
        style={{
          display: "block", width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
        }}
        aria-hidden="true"
      />
    </span>
  );
}

// ── SVG de olas — viewBox="0 0 1440 96" cubre el header completo ─────────────
function TopbarWaves() {
  return (
    <svg
      className="topbar-waves"
      viewBox="0 0 1440 96"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Capa superior — barrido sutil */}
      <path
        d="M0,20 C360,36 720,6 1080,20 C1260,28 1380,12 1440,20 L1440,0 L0,0 Z"
        fill="#5ba8f5" fillOpacity="0.06"
      />
      {/* Capa media */}
      <path
        d="M0,70 C180,52 360,88 540,70 C720,52 900,88 1080,70 C1260,52 1440,73 1440,70 L1440,96 L0,96 Z"
        fill="#4a90d9" fillOpacity="0.11"
      />
      {/* Capa base — rasante al borde inferior */}
      <path
        d="M0,82 C240,68 480,96 720,82 C960,68 1200,96 1440,82 L1440,96 L0,96 Z"
        fill="#1e6fbd" fillOpacity="0.15"
      />
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardTopbar({
  user,
  unreadCount,
  isFirstVisit,
  onGoHome,
  onLogout,
  onNavigate,
}: Props) {
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <header className="topbar topbar-size">

      {/* Olas — absolutas, detrás de todo el contenido */}
      <TopbarWaves />

      {/* ── SLOT IZQUIERDO: Logo (220px, alineado con el sidebar) ── */}
      <div className="topbar-logo-slot">
        <img
          src={logo_U}
          alt="Universidad Católica de Colombia"
          className="topbar-logo"
        />
      </div>

      {/* ── Saludo dinámico ── */}
      <div className="topbar-greeting">
        {isFirstVisit ? (
          <h1 className="topbar-welcome topbar-welcome--first">{t.dash_welcome_first}</h1>
        ) : (
          <h1 className="topbar-welcome">
            {t.dash_welcome_back} <strong>{firstName}</strong>
          </h1>
        )}
      </div>

      {/* ── Herramientas ── */}
      <div className="topbar-right">

        <button className="btn-go-home" onClick={onGoHome} title={t.dash_go_home}>
          <FaArrowLeft />
          <span>{t.dash_go_home}</span>
        </button>

        <button className="tb-icon-btn" title={t.dash_settings} onClick={() => onNavigate("settings")}>
          <FaCog />
        </button>

        <button className="tb-icon-btn tb-icon-btn--bell" title={t.dash_notifications} onClick={() => onNavigate("messages")}>
          <FaBell />
          {unreadCount > 0 && (
            <span className="tb-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        {/* Selector de idioma — el dropdown ahora NO se corta */}
        <div className="tb-lang" ref={langRef}>
          <button
            className="tb-lang-btn"
            onClick={() => setLangOpen(o => !o)}
            aria-label="Seleccionar idioma"
            title={LANGUAGES.find(l => l.code === lang)?.name}
          >
            <CircleFlag langCode={lang} size={30} />
          </button>

          {langOpen && (
            <div className="tb-lang-dropdown">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`tb-lang-option${l.code === lang ? " tb-lang-option--active" : ""}`}
                  onClick={() => { setLang(l.code as LangCode); setLangOpen(false); }}
                >
                  <CircleFlag langCode={l.code as LangCode} size={22} />
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn-mobile-logout" title={t.dash_logout} onClick={onLogout} />
      </div>
    </header>
  );
}
