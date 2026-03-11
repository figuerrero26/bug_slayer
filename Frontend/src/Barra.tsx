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

        slider.style.width = `${rect.width}px`;
        slider.style.left = `${rect.left - parentRect.left}px`;

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
            href="https://www.google.com/maps/place/Universidad+Cat%C3%B3lica+de+Colombia+Sede+4/@4.6342232,-74.0685259,17z/data=!3m1!4b1!4m6!3m5!1s0x8e3f9a2f84cd3649:0xabd321c3ea5f9e1c!8m2!3d4.6342232!4d-74.065951!16s%2Fg%2F1pw3y1zh2?entry=ttu&g_ep=EgoyMDI2MDMwOC4wIKXMDSoASAFQAw%3D%3D"
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
            <Link to="/ferias">Nuestras ferias</Link>
          </li>

          <li>
            <Link to="/inscripciones">Proceso de inscripciones</Link>
          </li>

          <li>
            <Link to="/noticias">Noticias</Link>
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