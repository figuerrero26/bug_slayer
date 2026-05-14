import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import VideoConiiti2 from "../../assets/videoconiiti.mp4";
import "../../css/Home.css";

function Home() {
  const { t } = useLang();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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
      observer.disconnect();
      clearInterval(timer);
    };
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

          <h1 className="hero-title">CONIITI <span className="hero-year">2026</span></h1>

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

      {/* ── TARJETAS ── */}
      <section className="cards-section">
        <div className="cards-header reveal">
          <h2 className="cards-title">{t.home_discover}</h2>
          <p className="cards-subtitle">{t.home_discover_sub}</p>
        </div>
        <div className="grid">
          <div className="card reveal delay-1">
            <h4>{t.card1_title}</h4>
            <p>{t.card1_p}</p>
            <div className="shine" />
          </div>
          <div className="card reveal delay-2">
            <h4>{t.card2_title}</h4>
            <p>{t.card2_p}</p>
            <div className="shine" />
          </div>
          <div className="card reveal delay-3">
            <h4>{t.card3_title}</h4>
            <p>{t.card3_p}</p>
            <div className="shine" />
          </div>
          <div className="card reveal delay-4">
            <h4>{t.card4_title}</h4>
            <p>{t.card4_p}</p>
            <div className="shine" />
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
