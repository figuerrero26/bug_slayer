import { useEffect } from "react";
import VideoConiiti from "./assets/CONIITI .mp4";
import VideoConiiti2 from "./assets/videoconiiti.mp4";
import imgItalia from "./assets/Italiabandera.png";
import Barra from "./Barra";
import imgCulture from "./assets/italiaimagenculture.png";
import "./css/Home.css";

function Home() {

  useEffect(() => {

    /* =========================================
       1. SLIDER DEL MENÚ
    ========================================= */

    const items = document.querySelectorAll(".menu li");
    const slider = document.querySelector(".slider");
    const menu = document.querySelector(".menu");

    function moveSlider(element) {
      if (element && slider) {
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();

        slider.style.width = `${rect.width}px`;
        slider.style.left = `${rect.left - parentRect.left}px`;
      }
    }

    items.forEach(item => {
      item.addEventListener("mouseenter", () => moveSlider(item));

      item.addEventListener("click", () => {
        document.querySelector(".menu li.active")?.classList.remove("active");
        item.classList.add("active");
      });
    });

    function handleResize() {
      const activeItem = document.querySelector(".menu li.active");
      moveSlider(activeItem);
    }

    function handleScrollReveal() {
      const reveals = document.querySelectorAll(".reveal");
      const windowHeight = window.innerHeight;

      reveals.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const revealPoint = 120;

        if (elementTop < windowHeight - revealPoint) {
          element.classList.add("active");
        }
      });
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScrollReveal);

    handleResize();
    handleScrollReveal();

    /* =========================================
       LIMPIEZA (MUY IMPORTANTE)
    ========================================= */

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScrollReveal);
    };

  }, []);

  return (
    <>
      {/* ================= HEADER ================= */}
      

      {/* ================= HERO ================= */}
      <Barra />
      <section className="hero">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="hero-video"
        >
          <source src={VideoConiiti2} type="video/mp4" />
        </video>

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1>Coniiti 2026</h1>
          <p>País invitado: Italia</p>
          <p>Conferencistas internacionales</p>
          <img src={imgItalia} alt="Bandera Italia" className="flag" />
        </div>

        <form className="search-form">
          <input type="text" placeholder="Buscar..." />
          <button type="submit">Buscar</button>
        </form>

      </section>

      {/* ================= TARJETAS ================= */}
      <section className="cards-section">
        <div className="grid">

          {/* CARD 1 */}
          <div className="card reveal delay-1">
            <h4>Home</h4>
            <p>Explora nuestra información principal.</p>
            <div className="shine"></div>
          </div>

          {/* CARD 2 */}
          <div className="card reveal delay-2">
            <h4>Nuestras Ferias</h4>
            <p>Eventos académicos y empresariales.</p>
            <div className="shine"></div>
          </div>

          {/* CARD 3 */}
          <div className="card reveal delay-3">
            <h4>Proceso de Inscripciones</h4>
            <p>Conoce los pasos para aplicar.</p>
            <div className="shine"></div>
          </div>

          {/* CARD 4 */}
          <div className="card reveal delay-4">
            <h4>Noticias</h4>
            <p>Mantente informado.</p>
            <div className="shine"></div>
          </div>

        </div>
      </section>
    </>
  );
}

export default Home;