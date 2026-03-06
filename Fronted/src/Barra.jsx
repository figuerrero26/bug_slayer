import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import VideoConiiti from "./assets/CONIITI .mp4";
import imgCulture from "./assets/italiaimagenculture.png";
import "./css/Home.css";

const Barra = () => {

  useEffect(() => {

    const items = document.querySelectorAll(".menu li");
    const slider = document.querySelector(".slider");

    function moveSlider(element) {
      if (element && slider) {
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();

        slider.style.width = `${rect.width}px`;
        slider.style.left = `${rect.left - parentRect.left}px`;
      }
    }

    function handleResize() {
      const activeItem = document.querySelector(".menu li.active");
      moveSlider(activeItem);
    }

    items.forEach(item => {

      item.addEventListener("mouseenter", () => moveSlider(item));

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
      <nav className="nav">

        <div className="logo">
          <video
            width="200"
            autoPlay
            muted
            loop
            className="logo-video"
          >
            <source src={VideoConiiti} type="video/mp4" />
          </video>

          <img src={imgCulture} alt="Italia Imagen Cultural" />
        </div>

        <ul className="menu">
          <li className="active">
            <Link to="/">Home</Link>
          </li>

          <li>
            <Link to="/nosotros">Nosotros</Link>
          </li>

          <li>Nuestras ferias</li>
          <li>Proceso de inscripciones</li>
          <li>Noticias</li>

          <li>
            <Link to="/login">Login</Link>
          </li>

          <div className="slider"></div>
        </ul>

      </nav>
    </header>
  );
};

export default Barra;