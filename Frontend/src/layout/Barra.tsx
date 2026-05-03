import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { IoLanguage } from "react-icons/io5";

import VideoConiiti from "../assets/CONIITI .mp4";
import logoMenu     from "../assets/logomenu.svg";
import imgCulture   from "../assets/selloycalidad.png";

import "../css/Home.css";

const NAV_LINKS = [
  { to: "/",              label: "Home" },
  { to: "/nosotros",      label: "Nosotros" },
  { to: "/ferias",        label: "Nuestras ferias" },
  { to: "/inscripciones", label: "Inscripciones" },
  { to: "/noticias",      label: "Noticias" },
  { to: "/login",         label: "Login" },
];

const Barra = () => {

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location                = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-icons">
          <a href="tel:+576014433700"><FaPhone /></a>
          <a href="mailto:coniiti@ucatolica.edu.co"><FaEnvelope /></a>
          <a
            href="https://www.google.com/maps/place/Universidad+Cat%C3%B3lica+de+Colombia+Sede+4/@4.6342232,-74.0685259,17z"
            target="_blank"
            rel="noreferrer"
          >
            <FaMapMarkerAlt />
          </a>
        </div>
        <div className="topbar-right">
          <div className="search-box">
            <FaSearch />
            <input type="text" placeholder="Buscar..." />
          </div>
          <div className="language">
            <IoLanguage />
            <select>
              <option>ES</option>
              <option>EN</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── NAV PRINCIPAL ── */}
      <nav className="nav">

        {/* LOGO */}
        <div className="logo">
          <video autoPlay muted loop className="logo-video">
            <source src={VideoConiiti} type="video/mp4" />
          </video>
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

        {/* MENU con contenedor glass */}
        <div className={`menu-glass${menuOpen ? " menu-glass--open" : ""}`}>
          <ul className="menu">
            {NAV_LINKS.map(({ to, label }) => (
              <li
                key={to}
                className={location.pathname === to ? "active" : ""}
              >
                <Link to={to} onClick={() => setMenuOpen(false)}>{label}</Link>
              </li>
            ))}

            {/* Logo al final del menú */}
            <li className="menu-logo-item">
              <img src={logoMenu} alt="CONIITI" className="menu-logo-icon" />
            </li>
          </ul>
        </div>

        {/*
          ╔══════════════════════════════════════╗
          ║  AÑO — ajustes disponibles en CSS    ║
          ║  Busca la clase  .nav-year           ║
          ║  en Home.css para cambiar:           ║
          ║  • tamaño de letra  → font-size      ║
          ║  • posición H       → justify-self   ║
          ║                       (start / center / end) ║
          ║  • posición fina    → margin-right / margin-left ║
          ║  • fuente           → font-family    ║
          ║  • color            → color          ║
          ╚══════════════════════════════════════╝
        */}
        {/* El año se actualiza solo cada 1 de enero */}
        <span className="nav-year">{new Date().getFullYear()}</span>

      </nav>

    </header>
  );

};

export default Barra;
