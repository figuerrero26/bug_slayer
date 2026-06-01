import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaSearch, FaChevronDown } from "react-icons/fa";
import { useLang, LANGUAGES, LangCode } from "../context/LanguageContext";

import GifConiiti from "../assets/CONIITI3.gif";
import logoMenu     from "../assets/logomenu.svg";
import imgCulture   from "../assets/selloycalidad.png";
import escudo       from "../assets/escudo-ucatolica.png";
import rogelio      from "../assets/rogelio.png";
import UserAvatar   from "./UserAvatar";

import "../css/Home.css";

const Barra = () => {

  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const [loggedIn, setLoggedIn]     = useState(() => !!sessionStorage.getItem("session"));
  const langRef                     = useRef<HTMLDivElement>(null);
  const location                    = useLocation();
  const { lang, setLang, t }        = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Sincroniza estado de sesión con login/logout */
  useEffect(() => {
    const sync = () => setLoggedIn(!!sessionStorage.getItem("session"));
    window.addEventListener("ua-session-change", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("ua-session-change", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  /* Cierra el dropdown de idioma al hacer click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === lang)!;

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-icons">
          <a href="tel:+576014433700"><FaPhone /></a>
          <a href="mailto:coniiti@ucatolica.edu.co"><FaEnvelope /></a>
          <a
            href="https://www.google.com/maps/place/Universidad+Cat%C3%B3lica+de+Colombia/@4.6349257,-74.0669646,16.81z/data=!4m6!3m5!1s0x8e3f9a2f9f28a575:0xa62eed86d7ca9551!8m2!3d4.6342311!4d-74.0659494!16s%2Fm%2F0cpdr62"
            target="_blank"
            rel="noreferrer"
          >
            <FaMapMarkerAlt />
          </a>
        </div>

        <div className="topbar-right">
          <div className="search-box">
            <FaSearch />
            <input type="text" placeholder={t.buscar} />
          </div>

          {/* ── SELECTOR DE IDIOMA MODERNO ── */}
          <div className="lang-selector" ref={langRef}>
            <button
              className="lang-btn"
              onClick={() => setLangOpen(!langOpen)}
              aria-label="Seleccionar idioma"
            >
             
              <span className="lang-name">{currentLang.name}</span>
              <FaChevronDown className={`lang-chevron${langOpen ? " lang-chevron--open" : ""}`} />
            </button>

            {langOpen && (
              <div className="lang-dropdown">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`lang-option${l.code === lang ? " lang-option--active" : ""}`}
                    onClick={() => { setLang(l.code as LangCode); setLangOpen(false); }}
                  >
                    <span className="lang-flag">{l.flag}</span>
                    <span className="lang-name">{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NAV PRINCIPAL ── */}
      <nav className="nav">

        {/* Cintas animadas */}
        <svg className="nav-ribbons" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
          <path className="nav-ribbon nav-ribbon-1" d="M -60 98 C 200 60, 520 125, 900 85 C 1180 50, 1350 115, 1510 78" />
          <path className="nav-ribbon nav-ribbon-2" d="M -60 112 C 220 72, 540 130, 920 92 C 1200 58, 1370 122, 1520 88" />
          <path className="nav-ribbon nav-ribbon-3" d="M -60 82 C 210 48, 530 108, 880 70 C 1160 38, 1340 100, 1510 62" />
          <path className="nav-ribbon nav-ribbon-4" d="M -60 90 C 230 55, 550 118, 910 78 C 1190 44, 1360 108, 1515 70" />
          <path className="nav-ribbon nav-ribbon-5" d="M -60 60 C 220 46, 540 72, 900 55 C 1180 42, 1360 68, 1520 52" />
          <path className="nav-ribbon nav-ribbon-6" d="M -60 102 C 220 88, 540 115, 900 98 C 1180 82, 1360 108, 1520 92" />
        </svg>

        {/* LOGO */}
        <div className="logo">
          <img src={GifConiiti} alt="CONIITI" className="logo-video" />
          <img src={imgCulture} alt="Sello de calidad" className="logo-culture" />
        </div>

        {/* HAMBURGUESA — solo móvil */}
        <button
          className={`hamburger${menuOpen ? " hamburger-open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span /><span /><span />
        </button>

        {/* MENU */}
        <div className={`menu-glass${menuOpen ? " menu-glass--open" : ""}`}>
          <ul className="menu">
            {([
              { to: "/",              label: t.home          },
              { to: "/nosotros",      label: t.nosotros      },
              { to: "/ferias",        label: t.ferias        },
              { to: "/inscripciones", label: t.inscripciones },
              { to: "/noticias",      label: t.noticias      },
              { to: "/ponentes",     label: t.ponentes      },
            ] as { to: string; label: string }[]).map(({ to, label }) => (
              <li key={to} className={location.pathname === to ? "active" : ""}>
                <Link to={to} onClick={() => setMenuOpen(false)}>{label}</Link>
              </li>
            ))}

            <li className="menu-logo-item">
              <img src={logoMenu} alt="CONIITI" className="menu-logo-icon" />
            </li>
          </ul>
        </div>

        {/* SLOT DERECHO: año + ingresar + avatar */}
        <div className="nav-right-slot">
          <span className="nav-year">2026</span>
          {!loggedIn && (
            <Link
              to="/login"
              className={`nav-login-pill${location.pathname === "/login" ? " nav-login-pill--active" : ""}`}
            >
              <svg className="nav-login-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 2h2.5a1.2 1.2 0 0 1 1.2 1.2v9.6a1.2 1.2 0 0 1-1.2 1.2H10"
                  stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 5.5L10.5 8 7 10.5"
                  stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 8h8"
                  stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <span className="nav-login-label">{t.login}</span>
            </Link>
          )}
          <UserAvatar />
        </div>

        {/* Rogelio */}
        <div className="rogelio-wrapper">
          <img src={rogelio} className="rogelio-sprite" alt="" draggable={false} />
        </div>

      </nav>

    </header>
  );

};

export default Barra;
