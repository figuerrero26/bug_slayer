import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { IoLanguage } from "react-icons/io5";

import VideoConiiti from "./assets/CONIITI .mp4";
import imgCulture from "./assets/selloycalidad.png";

import "./css/Home.css";

const Barra = () => {

  useEffect(() => {

    const items = document.querySelectorAll(".menu li");
    const slider = document.querySelector(".slider") as HTMLElement | null;

    function moveSlider(element: HTMLElement | null) {
      if (element && slider && element.parentElement) {

        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();

        (slider as HTMLElement).style.width = `${rect.width}px`;
        (slider as HTMLElement).style.left = `${rect.left - parentRect.left}px`;

      }
    }

    function handleResize() {

      const activeItem = document.querySelector(".menu li.active") as HTMLElement | null;
      moveSlider(activeItem);

    }

    items.forEach(item => {

      item.addEventListener("mouseenter", () => moveSlider(item as HTMLElement));

      item.addEventListener("click", () => {

        document
          .querySelector(".menu li.active")
          ?.classList.remove("active");

        item.classList.add("active");

      });

    });

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {

      window.removeEventListener("resize", handleResize);

    };

  }, []);

  return (

    <header className="header">

      {/* ========================
            BARRA SUPERIOR
      ======================== */}

      <div className="topbar">

        {/* ICONOS IZQUIERDA */}

        <div className="topbar-icons">

          <a href="tel:+576014433700">
            <FaPhone />
          </a>

          <a href="mailto:coniiti@ucatolica.edu.co">
            <FaEnvelope />
          </a>

          <a
            href="https://www.ucatolica.edu.co"
            target="_blank"
            rel="noreferrer"
          >
            <FaMapMarkerAlt />
          </a>

        </div>

        {/* BUSCADOR + IDIOMA */}

        <div className="topbar-right">

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar..."
            />
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

      {/* ========================
            NAVBAR PRINCIPAL
      ======================== */}

      <nav className="nav">

        {/* LOGO + VIDEO */}

        <div className="logo">

          <video
            autoPlay
            muted
            loop
            className="logo-video"
          >
            <source src={VideoConiiti} type="video/mp4" />
          </video>

          <img
            src={imgCulture}
            alt="Italia Imagen Cultural"
          />

        </div>

        {/* MENU */}

        <ul className="menu">

          <li className="active">
            <Link to="/">Home</Link>
          </li>

          <li>
            <Link to="/nosotros">Nosotros</Link>
          </li>

          <li>
            Nuestras ferias
          </li>

          <li>
            Proceso de inscripciones
          </li>

          <li>
            Noticias
          </li>

          <li>
            <Link to="/login">
              Login
            </Link>
          </li>

          {/* LINEA ANIMADA */}

          <div className="slider"></div>

        </ul>

      </nav>

    </header>

  );

};

export default Barra;
