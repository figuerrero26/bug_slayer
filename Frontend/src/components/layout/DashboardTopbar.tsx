import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaCog, FaBell } from "react-icons/fa";
import ReactCountryFlag from "react-country-flag";
import { motion, AnimatePresence } from "framer-motion";
import logo_U from "../../assets/CONIITI3_dashboard.gif";
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

// ── Bandera circular (selector de idioma) ────────────────────────────────────
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


// ── SVG de olas ───────────────────────────────────────────────────────────────
function TopbarWaves() {
  return (
    <svg
      className="topbar-waves"
      viewBox="0 0 1440 96"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0,20 C360,36 720,6 1080,20 C1260,28 1380,12 1440,20 L1440,0 L0,0 Z"
        fill="#5ba8f5" fillOpacity="0.06" />
      <path d="M0,70 C180,52 360,88 540,70 C720,52 900,88 1080,70 C1260,52 1440,73 1440,70 L1440,96 L0,96 Z"
        fill="#4a90d9" fillOpacity="0.11" />
      <path d="M0,82 C240,68 480,96 720,82 C960,68 1200,96 1440,82 L1440,96 L0,96 Z"
        fill="#1e6fbd" fillOpacity="0.15" />
    </svg>
  );
}

// ── Animación Ciao → Bienvenido ───────────────────────────────────────────────
function GreetingAnimator({
  firstName,
  isFirstVisit,
  t,
}: {
  firstName:    string;
  isFirstVisit: boolean;
  t:            Record<string, string>;
}) {
  const [phase, setPhase] = useState<"ciao" | "welcome">("ciao");

  useEffect(() => {
    let welcomeTimer: ReturnType<typeof setTimeout>;

    const startCycle = () => {
      setPhase("ciao");
      clearTimeout(welcomeTimer);
      welcomeTimer = setTimeout(() => setPhase("welcome"), 3000);
    };

    // Transición inicial: ciao → bienvenido a los 3s
    welcomeTimer = setTimeout(() => setPhase("welcome"), 3000);

    // Repetir el ciclo completo cada 31 segundos
    const cycleTimer = setInterval(startCycle, 31000);

    return () => {
      clearTimeout(welcomeTimer);
      clearInterval(cycleTimer);
    };
  }, []);

  return (
    <div className="topbar-greeting-anim">
      <AnimatePresence mode="wait">
        {phase === "ciao" ? (
          <motion.div
            key="ciao"
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
            exit={{    opacity: 0, y: -12, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="topbar-welcome topbar-ciao">
              <span className="topbar-ciao-text">Ciao,</span>
              {" "}<strong>{firstName}</strong>
            </h1>
            <p className="topbar-subtitle topbar-subtitle--italy">
              Paese ospite · CONIITI 2026
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
            exit={{    opacity: 0, y: -12, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {isFirstVisit ? (
              <h1 className="topbar-welcome topbar-welcome--first">
                {t.dash_welcome_first}
              </h1>
            ) : (
              <h1 className="topbar-welcome">
                {t.dash_welcome_back} <strong>{firstName}</strong>
              </h1>
            )}
            <p className="topbar-subtitle">CONIITI 2026 · Italia</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [langOpen, setLangOpen]           = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langRef    = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);

  // Cierra dropdown de idioma al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cierra menú móvil al hacer click fuera
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node))
        setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <>
      <header className="topbar topbar-size">

        <TopbarWaves />

        {/* ── Hamburguesa — solo en móvil ── */}
        <button
          className={`tb-hamburger${mobileMenuOpen ? " tb-hamburger--open" : ""}`}
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Abrir menú"
        >
          <span /><span /><span />
        </button>

        {/* ── SLOT IZQUIERDO: Logo ── */}
        <div className="topbar-logo-slot">
          <img
            src={logo_U}
            alt="Universidad Católica de Colombia"
            className="topbar-logo"
          />
        </div>

        {/* ── Saludo animado Ciao → Bienvenido ── */}
        <div className="topbar-greeting">
          <GreetingAnimator
            firstName={firstName}
            isFirstVisit={isFirstVisit}
            t={t}
          />
        </div>

        {/* ── Herramientas ── */}
        <div className="topbar-right">

          {/* Solo desktop */}
          <button className="btn-go-home tb-desktop-only" onClick={onGoHome} title={t.dash_go_home}>
            <FaArrowLeft />
            <span>{t.dash_go_home}</span>
          </button>

          <button className="tb-icon-btn tb-desktop-only" title={t.dash_settings} onClick={() => onNavigate("settings")}>
            <FaCog />
          </button>

          {/* Siempre visible */}
          <button className="tb-icon-btn tb-icon-btn--bell" title={t.dash_notifications} onClick={() => onNavigate("messages")}>
            <FaBell />
            {unreadCount > 0 && (
              <span className="tb-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </button>

          {/* Selector de idioma — solo desktop */}
          <div className="tb-lang tb-desktop-only" ref={langRef}>
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

          {/* Logout — siempre visible */}
          <button className="btn-mobile-logout" title={t.dash_logout} onClick={onLogout} />
        </div>

      </header>

      {/* ── Menú móvil desplegable ── */}
      {mobileMenuOpen && (
        <div className="tb-mobile-menu" ref={mobileRef}>

          <button
            className="tb-mobile-menu-item"
            onClick={() => { onGoHome(); setMobileMenuOpen(false); }}
          >
            <FaArrowLeft className="tb-mobile-menu-icon" />
            <span>{t.dash_go_home}</span>
          </button>

          <button
            className="tb-mobile-menu-item"
            onClick={() => { onNavigate("settings"); setMobileMenuOpen(false); }}
          >
            <FaCog className="tb-mobile-menu-icon" />
            <span>{t.dash_settings}</span>
          </button>

          <div className="tb-mobile-menu-divider" />

          <div className="tb-mobile-menu-langs">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`tb-mobile-lang-btn${l.code === lang ? " tb-mobile-lang-btn--active" : ""}`}
                onClick={() => { setLang(l.code as LangCode); setMobileMenuOpen(false); }}
              >
                <CircleFlag langCode={l.code as LangCode} size={18} />
                <span>{l.name}</span>
              </button>
            ))}
          </div>

        </div>
      )}
    </>
  );
}
