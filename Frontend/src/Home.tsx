import { useEffect, useState } from "react";//cuenta regresiva
import VideoConiiti from "./assets/CONIITI .mp4";
import VideoConiiti2 from "./assets/videoconiiti.mp4";
import imgItalia from "./assets/Italiabandera.png";
import Barra from "./Barra";
import imgCulture from "./assets/selloycalidad.png";
import Footer from "./Footer";
import "./css/Home.css";
import "./css/Statsbar.css"

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


      <section id="ponentes">

  <div className="container">

    <div className="reveal" style={{textAlign:"center"}}>
      <p className="section-label">Conferencistas País Invitado</p>
      <h2 id="ponentes-heading" className="section-title">
        Nuestros ponentes
      </h2>
      <div className="divider" style={{marginInline:"auto"}}></div>
    </div>

    <div className="speakers-grid">

      <div className="speaker-card reveal">
        <div className="speaker-avatar">AM</div>
        <p className="speaker-name">Ana Martínez</p>
        <p className="speaker-role">Directora de IA · Google LATAM</p>
      </div>

      <div className="speaker-card reveal">
        <div className="speaker-avatar">CR</div>
        <p className="speaker-name">Carlos Ruiz</p>
        <p className="speaker-role">CTO · Startup italia</p>
      </div>

      <div className="speaker-card reveal">
        <div className="speaker-avatar">LV</div>
        <p className="speaker-name">Laura Vega</p>
        <p className="speaker-role">Investigadora · MIT Media Lab</p>
      </div>

      <div className="speaker-card reveal">
        <div className="speaker-avatar">JP</div>
        <p className="speaker-name">Javier Paredes</p>
        <p className="speaker-role">CEO · Fintech Colombia</p>
      </div>

      <div className="speaker-card reveal">
        <div className="speaker-avatar">MF</div>
        <p className="speaker-name">María Fuentes</p>
        <p className="speaker-role">Ciberseguridad · INCIBE</p>
      </div>

      <div className="speaker-card reveal">
        <div className="speaker-avatar">RS</div>
        <p className="speaker-name">Rodrigo Salinas</p>
        <p className="speaker-role">Partner · Sequoia Capital</p>
      </div>

    </div>

  </div>

</section>

{/* ================= AGENDA ================= */}
<section id="agenda">

  <div className="container">

    <div className="reveal">
      <p className="section-label">Programa</p>
      <h2 id="agenda-heading" className="section-title">
        Agenda del evento
      </h2>
      <div className="divider"></div>
    </div>

    <div className="cards-grid">

      <article className="card reveal">
        <span className="card-tag">IA</span>
        <h3>IA Generativa aplicada</h3>
        <p>
          Del modelo al producto: cómo construir soluciones reales con LLMs en tu empresa.
        </p>
        <div className="card-meta">
          <span>🕘 09:00 – 10:30</span>
          <span>📍 Sala A</span>
        </div>
      </article>

      <article className="card reveal">
        <span className="card-tag">Seguridad</span>
        <h3>Ciberseguridad en 2026</h3>
        <p>
          Amenazas emergentes, defensa proactiva y el rol de la IA en la protección de datos.
        </p>
        <div className="card-meta">
          <span>🕙 11:00 – 12:30</span>
          <span>📍 Sala B</span>
        </div>
      </article>

      <article className="card reveal">
        <span className="card-tag">Empresa</span>
        <h3>Transformación Digital real</h3>
        <p>
          Casos de éxito y fracaso: lecciones aprendidas en procesos de digitalización empresarial.
        </p>
        <div className="card-meta">
          <span>🕑 14:00 – 15:30</span>
          <span>📍 Auditorio</span>
        </div>
      </article>

      <article className="card reveal">
        <span className="card-tag">Taller</span>
        <h3>Cloud & DevOps avanzado</h3>
        <p>
          Infraestructura como código, pipelines CI/CD y observabilidad en entornos cloud-native.
        </p>
        <div className="card-meta">
          <span>🕓 16:00 – 18:00</span>
          <span>📍 Laboratorio 1</span>
        </div>
      </article>

      <article className="card reveal">
        <span className="card-tag">Startups</span>
        <h3>Inversión en tech latam</h3>
        <p>
          Panel de inversores: qué buscan los VCs en el ecosistema tecnológico latinoamericano.
        </p>
        <div className="card-meta">
          <span>🕙 10:00 – 11:30</span>
          <span>📍 Sala C</span>
        </div>
      </article>

      <article className="card reveal">
        <span className="card-tag">Keynote</span>
        <h3>Keynote de cierre</h3>
        <p>
          Visión 2030: el mapa tecnológico que definirá los próximos cinco años de la industria.
        </p>
        <div className="card-meta">
          <span>🕔 17:00 – 18:30</span>
          <span>📍 Auditorio</span>
        </div>
      </article>

    </div>

  </div>

</section>

      <Footer />
    </>
  );
}

export default Home;