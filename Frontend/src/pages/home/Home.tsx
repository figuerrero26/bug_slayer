import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import VideoConiiti2 from "../../assets/videofondoconiiti.mp4";
import ieeeGroup    from "../../assets/ieee_group.jpeg";
import ieeeLogo     from "../../assets/logo_ieee_colombia.png";
import "../../css/Home.css";

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="9" cy="9" r="8" fill="rgba(255,209,0,0.15)" />
      <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#FFD100" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Home() {
  const { t } = useLang();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [typedText, setTypedText]   = useState("");
  const [showYear,  setShowYear]    = useState(false);

  const snakeRef1 = useRef<SVGPathElement>(null);
  const snakeRef2 = useRef<SVGPathElement>(null);
  const snakeRef3 = useRef<SVGPathElement>(null);

  useEffect(() => {
    /* ── Slider del menú ── */
    const items  = document.querySelectorAll(".menu li");
    const slider = document.querySelector(".slider") as HTMLElement | null;

    function moveSlider(el: HTMLElement | null) {
      if (!el || !slider || !el.parentElement) return;
      const r  = el.getBoundingClientRect();
      const pr = el.parentElement.getBoundingClientRect();
      slider.style.width = `${r.width}px`;
      slider.style.left  = `${r.left - pr.left}px`;
    }

    items.forEach(item => {
      item.addEventListener("mouseenter", () => moveSlider(item as HTMLElement));
      item.addEventListener("click", () => {
        document.querySelector(".menu li.active")?.classList.remove("active");
        item.classList.add("active");
      });
    });

    const onResize = () => moveSlider(document.querySelector(".menu li.active") as HTMLElement | null);
    window.addEventListener("resize", onResize, { passive: true });
    onResize();

    /* ── Scroll reveal con IntersectionObserver ── */
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("active"); observer.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

    /* ── Highlights strip: anima al cargar sin esperar scroll ── */
    const revealTimer = setTimeout(() => {
      document.querySelectorAll(".highlight-item.reveal").forEach(el => el.classList.add("active"));
    }, 400);

    /* ── Cuenta regresiva ── */
    const target = new Date("SEP 23, 2026 00:00:00").getTime();
    const tick = () => {
      const diff = target - Date.now();
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(revealTimer);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const configs = [
      { ref: snakeRef1, seg: 640, dur: 9,  delay: 0 },
      { ref: snakeRef2, seg: 520, dur: 13, delay: 3 },
      { ref: snakeRef3, seg: 400, dur: 17, delay: 7 },
    ];
    configs.forEach(({ ref, seg, dur, delay }, i) => {
      const el = ref.current;
      if (!el) return;
      const L  = Math.ceil(el.getTotalLength());
      const from = L + 20;
      const to   = -(L + seg + 20);
      const name = `snakeTrav_${i}`;
      const existing = document.getElementById(`sk-kf-${i}`);
      if (existing) existing.remove();
      const s = document.createElement("style");
      s.id = `sk-kf-${i}`;
      s.textContent = `@keyframes ${name}{from{stroke-dashoffset:${from}}to{stroke-dashoffset:${to}}}`;
      document.head.appendChild(s);
      el.style.strokeDasharray = `${seg} ${L * 2 + seg}`;
      el.style.animation = `${name} ${dur}s linear ${delay}s infinite`;
    });
  }, []);

  useEffect(() => {
    const word = "CONIITI";
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // En móvil: muestra el título completo de inmediato, sin animación
      setTypedText(word);
      setShowYear(true);
      return;
    }

    // En desktop: efecto typewriter normal
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const delay = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setTypedText(word.slice(0, i));
        if (i === word.length) {
          clearInterval(interval);
          setTimeout(() => setShowYear(true), 420);
        }
      }, 105);
    }, 550);
    return () => { clearTimeout(delay); clearInterval(interval); };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src={VideoConiiti2} type="video/mp4" />
        </video>
        <div className="hero-overlay" />

        <div className="hero-content">
          <span className="hero-edition">{t.hero_edition}</span>

          <h1 className="hero-title">
            <span className="hero-name">
              {typedText}
              {!showYear && <span className="hero-cursor" aria-hidden="true" />}
            </span>
            {showYear && <span className="hero-year">2026</span>}
          </h1>

          <p className="hero-tagline">{t.hero_tagline}</p>

          <Link to="/inscripciones" className="hero-cta">
            {t.hero_cta}
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* Barra de info inferior */}
          <div className="hero-bottom-bar">
            <span className="hero-info-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {t.hero_city}
            </span>
            <span className="hero-bar-dot" />
            <span className="hero-info-item">{t.hero_date}</span>
            <span className="hero-bar-dot" />
            <span className="hero-info-item hero-italy-inline">
              {t.hero_guest}
              <span className="it-mini">
                <span className="it-g"/><span className="it-w"/><span className="it-r"/>
              </span>
              Italia
            </span>
          </div>
        </div>
        {/* Onda con gradiente colores UC Colombia + Italia */}
        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="waveMain" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#03124e" />
                <stop offset="30%"  stopColor="#0a2a72" />
                <stop offset="60%"  stopColor="#003087" />
                <stop offset="85%"  stopColor="#0a2a72" />
                <stop offset="100%" stopColor="#03124e" />
              </linearGradient>
              <linearGradient id="waveAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#009246" stopOpacity="0" />
                <stop offset="35%"  stopColor="#009246" stopOpacity="0.22" />
                <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.06" />
                <stop offset="65%"  stopColor="#CE2B37" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#CE2B37" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="waveGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#FFD100" stopOpacity="0" />
                <stop offset="45%"  stopColor="#FFD100" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#FFD100" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Capa base — azul UC Colombia */}
            <path d="M0,45 C240,90 480,10 720,45 C960,80 1200,15 1440,45 L1440,90 L0,90 Z"
              fill="url(#waveMain)" />
            {/* Acento italiano — verde · blanco · rojo difuminado */}
            <path d="M0,58 C300,25 620,75 900,48 C1100,32 1300,65 1440,52 L1440,90 L0,90 Z"
              fill="url(#waveAccent)" />
            {/* Acento dorado UC Colombia */}
            <path d="M0,70 C360,45 720,80 1080,55 C1260,44 1380,68 1440,60 L1440,90 L0,90 Z"
              fill="url(#waveGold)" />
          </svg>
        </div>
      </section>

      {/* ── CIFRAS CLAVE ── */}
      <div className="highlights-strip">
        <div className="highlight-item reveal delay-1">
          <span className="highlight-num">XII</span>
          <span className="highlight-label">Edición</span>
        </div>
        <div className="highlight-sep" aria-hidden="true" />
        <div className="highlight-item reveal delay-2">
          <span className="highlight-num">95</span>
          <span className="highlight-label">{t.stat_speakers}</span>
        </div>
        <div className="highlight-sep" aria-hidden="true" />
        <div className="highlight-item reveal delay-3">
          <span className="highlight-num">20+</span>
          <span className="highlight-label">Países</span>
        </div>
        <div className="highlight-sep" aria-hidden="true" />
        <div className="highlight-item reveal delay-4">
          <div className="highlight-flag-it">
            <span className="it-g" /><span className="it-w" /><span className="it-r" />
          </div>
          <span className="highlight-label">{t.stat_host}</span>
        </div>
      </div>

      {/* ── CUENTA REGRESIVA ── */}
      <section className="countdown-section">
        <span className="countdown-eyebrow">CONIITI 2026 · {t.hero_city}</span>
        <h2 className="countdown-heading">{t.countdown_label}</h2>
        <div className="countdown-units">
          <div className="countdown-unit reveal delay-1">
            <div className="countdown-card">
              <span className="countdown-num">{pad(timeLeft.days)}</span>
            </div>
            <span className="countdown-unit-label">{t.days}</span>
          </div>
          <span className="countdown-sep" aria-hidden="true">:</span>
          <div className="countdown-unit reveal delay-2">
            <div className="countdown-card">
              <span className="countdown-num">{pad(timeLeft.hours)}</span>
            </div>
            <span className="countdown-unit-label">{t.hours}</span>
          </div>
          <span className="countdown-sep" aria-hidden="true">:</span>
          <div className="countdown-unit reveal delay-3">
            <div className="countdown-card">
              <span className="countdown-num">{pad(timeLeft.minutes)}</span>
            </div>
            <span className="countdown-unit-label">{t.minutes}</span>
          </div>
          <span className="countdown-sep" aria-hidden="true">:</span>
          <div className="countdown-unit reveal delay-4">
            <div className="countdown-card">
              <span className="countdown-num">{pad(timeLeft.seconds)}</span>
            </div>
            <span className="countdown-unit-label">{t.seconds}</span>
          </div>
        </div>
      </section>

      {/* ── TARIFAS ── */}
      <section className="cards-section">
        <svg className="cards-deco-lines" viewBox="0 0 1440 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path ref={snakeRef1} className="snake-path-1" d="M 0,560 C 160,590 320,360 480,440 C 640,520 800,220 960,290 C 1120,360 1290,90 1440,50" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2.5"/>
          <path ref={snakeRef2} className="snake-path-2" d="M 0,360 C 160,390 320,160 480,240 C 640,320 800,20 960,90 C 1120,160 1290,-110 1440,-150" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="2"/>
          <path ref={snakeRef3} className="snake-path-3" d="M 0,160 C 160,190 320,-40 480,40 C 640,120 800,-180 960,-110 C 1120,-40 1290,-310 1440,-350" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="2"/>
        </svg>
        <div className="cards-header reveal">
          <h2 className="cards-title">Tarifas de Inscripción</h2>
          <p className="cards-subtitle">Selecciona el plan que mejor se adapte a tu participación en CONIITI 2026</p>
        </div>
        <div className="pricing-grid">

          {/* Plan 1 */}
          <div className="pricing-card reveal delay-1">
            <div className="pricing-shine" />
            <p className="pricing-category">Miembro</p>
            <h4 className="pricing-title">Miembros UCatólica e IEEE</h4>
            <div className="pricing-price">
              <span className="pricing-currency">$</span>
              <span className="pricing-amount">940.000</span>
              <span className="pricing-unit">COP</span>
            </div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li><CheckIcon />Inscripción como Ponente</li>
              <li><CheckIcon />Constancia para todos los autores</li>
              <li><CheckIcon />Publicación de memorias</li>
            </ul>
          </div>

          {/* Plan 2 */}
          <div className="pricing-card pricing-card--featured reveal delay-2">
            <div className="pricing-shine" />
            <p className="pricing-category">No miembro</p>
            <h4 className="pricing-title">Sí no eres miembro UCatólica ó IEEE</h4>
            <div className="pricing-price">
              <span className="pricing-currency">$</span>
              <span className="pricing-amount">980.000</span>
              <span className="pricing-unit">COP</span>
            </div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li><CheckIcon />Inscripción como Ponente</li>
              <li><CheckIcon />Constancia para todos los autores</li>
              <li><CheckIcon />Publicación de memorias</li>
            </ul>
          </div>

          {/* Plan 3 */}
          <div className="pricing-card pricing-card--add-on reveal delay-3">
            <div className="pricing-shine" />
            <p className="pricing-category pricing-category--add-on">Asistente · Opcional</p>
            <h4 className="pricing-title">Constancia por participación en Conferencias</h4>
            <div className="pricing-price">
              <span className="pricing-currency">$</span>
              <span className="pricing-amount">120.000</span>
              <span className="pricing-unit">COP</span>
            </div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li><CheckIcon />Certificado de Asistencia</li>
            </ul>
          </div>

          {/* Plan 4 */}
          <div className="pricing-card pricing-card--add-on reveal delay-4">
            <div className="pricing-shine" />
            <p className="pricing-category pricing-category--add-on">Asistente · Opcional</p>
            <h4 className="pricing-title">Constancia por participación en Workshops</h4>
            <div className="pricing-price">
              <span className="pricing-currency">$</span>
              <span className="pricing-amount">90.000</span>
              <span className="pricing-unit">COP</span>
            </div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li><CheckIcon />Certificado de Asistencia</li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── PATROCINADORES ── */}
      <section className="sponsors-section" style={{ backgroundImage: `url(${ieeeGroup})` }}>
        <div className="sponsors-overlay" />
        <div className="sponsors-content reveal">
          <p className="sponsors-eyebrow">Alianza estratégica</p>
          <h2 className="sponsors-heading">Con el apoyo y copatrocinio de</h2>
          <div className="sponsors-divider" aria-hidden="true" />
          <div className="sponsors-grid">
            <a
              href="https://ieee.org.co/seccion/acerca-de-nosotros/"
              target="_blank"
              rel="noreferrer"
              className="sponsor-card"
            >
              <img src={ieeeLogo} alt="IEEE Colombia Section" className="sponsor-logo" />
              <span className="sponsor-label">IEEE Colombia Section</span>
            </a>
          </div>
          <a
            href="https://ieee.org.co/seccion/acerca-de-nosotros/"
            target="_blank"
            rel="noreferrer"
            className="sponsors-cta"
          >
            Conoce más sobre IEEE Colombia
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

    </>
  );
}

export default Home;
