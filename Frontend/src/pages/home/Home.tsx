import { useEffect, useState } from "react";//cuenta regresiva
import VideoConiiti from "../../assets/CONIITI .mp4";
import VideoConiiti2 from "../../assets/videoconiiti.mp4";
import imgItalia from "../../assets/Italiabandera.png";
import Barra from "../../layout/Barra.tsx";
import imgCulture from "../../assets/selloycalidad.png";
import "../../css/Home.css";
import "../../css/Statsbar.css"

function Home() {

  const [timeLeft, setTimeLeft] = useState({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
});

  useEffect(() => {

    /* =========================================
       1. SLIDER DEL MENÚ
    ========================================= */

    const items = document.querySelectorAll(".menu li");
    const slider = document.querySelector(".slider") as HTMLElement | null;
    const menu = document.querySelector(".menu");

    function moveSlider(element: HTMLElement | null) {
      if (element && slider && element.parentElement) {
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();

        (slider as HTMLElement).style.width = `${rect.width}px`;
        (slider as HTMLElement).style.left = `${rect.left - parentRect.left}px`;
      }
    }

    items.forEach(item => {
      item.addEventListener("mouseenter", () => moveSlider(item as HTMLElement));

      item.addEventListener("click", () => {
        document.querySelector(".menu li.active")?.classList.remove("active");
        item.classList.add("active");
      });
    });

    function handleResize() {
      const activeItem = document.querySelector(".menu li.active") as HTMLElement | null;
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

    //cuenta regresiva
    const targetDate = new Date("SEP 23, 2026 00:00:00").getTime();

const timer = setInterval(() => {

  const now = new Date().getTime();
  const difference = targetDate - now;

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  setTimeLeft({ days, hours, minutes, seconds });

}, 1000);

    /* =========================================
       LIMPIEZA (MUY IMPORTANTE)
    ========================================= */

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScrollReveal);
      clearInterval(timer);
    };

  }, []);

  return (
    <>
      {/* ================= HEADER ================= */}
      

      {/* ================= HERO ================= */}
      
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

<div className="stats-bar">
  <div className="stats-scroll">
    <div className="stat-item"><div className="stat-num">95</div><div className="stat-label">Conferencistas</div></div>
    <div className="stat-item"><div className="stat-num">1</div><div className="stat-label">Patrocinadores</div></div>
    <div className="stat-item"><div className="stat-num">30</div><div className="stat-label">Ofertas de Workshops</div></div>
    <div className="stat-item"><div className="stat-num">100+</div><div className="stat-label">Participantes del Evento</div></div>
    <div className="stat-item"><div className="stat-num">🇮🇹</div><div className="stat-label">País anfitrion</div></div>
    <div className="stat-item"><div className="stat-num">39</div><div className="stat-label">Días de torneo</div></div>

    {/* duplicado para scroll infinito */}
    <div className="stat-item"><div className="stat-num">95</div><div className="stat-label">Conferencistas</div></div>
    <div className="stat-item"><div className="stat-num">1</div><div className="stat-label">Patrocinadores</div></div>
    <div className="stat-item"><div className="stat-num">30</div><div className="stat-label">Ofertas de Workshops</div></div>
    <div className="stat-item"><div className="stat-num">100+</div><div className="stat-label">Participantes del Evento</div></div>
    <div className="stat-item"><div className="stat-num">🇮🇹</div><div className="stat-label">País anfitrion</div></div>
    <div className="stat-item"><div className="stat-num">39</div><div className="stat-label">Días de torneo</div></div>
  </div>
</div>

<div className="countdown-section">

  <div className="countdown-label">
  </div>

  <div className="countdown-units">

    <div className="countdown-unit">
      <span className="countdown-num">{timeLeft.days}</span>
      <div className="countdown-unit-label">Días</div>
    </div>

    <div className="countdown-unit">
      <span className="countdown-num">{timeLeft.hours}</span>
      <div className="countdown-unit-label">Horas</div>
    </div>

    <div className="countdown-unit">
      <span className="countdown-num">{timeLeft.minutes}</span>
      <div className="countdown-unit-label">Minutos</div>
    </div>

    <div className="countdown-unit">
      <span className="countdown-num">{timeLeft.seconds}</span>
      <div className="countdown-unit-label">Segundos</div>
    </div>

  </div>


</div>

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