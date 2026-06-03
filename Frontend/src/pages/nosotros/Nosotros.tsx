import { useEffect, useRef, useState, type ReactNode } from "react";
import edificioImg from "../../assets/ucatolica-edificio.jpg";
import frenteSede4 from "../../assets/frente sede 4.jpg";
import conferenciaImg from "../../assets/conferencias.jpg";
import ieeeImg from "../../assets/ieee_group.jpeg";
import logoUcc from "../../assets/LogoUcatolica.png";
import { useLang } from "../../context/LanguageContext";
import "../../css/Nosotros.css";

const STATS = [
  { num: "XII",  label: "Edición" },
  { num: "20+",  label: "Países" },
  { num: "800+", label: "Investigadores" },
  { num: "50+",  label: "Años UCC" },
];

const ICON_GLOBE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
  </svg>
);
const ICON_LIGHTBULB = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/>
    <line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);
const ICON_NETWORK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="2"/>
    <line x1="12" y1="7" x2="12" y2="14"/>
    <polyline points="5,17 12,14 19,17"/>
  </svg>
);
const ICON_GRAD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const ICONS = [ICON_GLOBE, ICON_LIGHTBULB, ICON_NETWORK, ICON_GRAD];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className="nos-fadein"
      style={{ transitionDelay: `${delay}ms`, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)" }}
    >
      {children}
    </div>
  );
}

export default function Nosotros() {
  const { t } = useLang();

  const objetivos = [
    { icono: ICONS[0], titulo: t.goal1_t, texto: t.goal1_p },
    { icono: ICONS[1], titulo: t.goal2_t, texto: t.goal2_p },
    { icono: ICONS[2], titulo: t.goal3_t, texto: t.goal3_p },
    { icono: ICONS[3], titulo: t.goal4_t, texto: t.goal4_p },
  ];

  return (
    <div className="nos-page">

      {/* HERO */}
      <section className="nos-hero">
        <img src={edificioImg} alt="" className="nos-hero-img" aria-hidden="true" />
        <div className="nos-hero-overlay" />
        <div className="nos-hero-content">
          <span className="nos-hero-pill">CONIITI 2026</span>
          <h1 className="nos-hero-title">
            Sobre <span className="nos-hero-accent">Nosotros</span>
          </h1>
          <p className="nos-hero-sub">
            Conoce el congreso internacional de ingeniería más importante de Colombia
          </p>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="nos-stats-strip">
        {STATS.map((s) => (
          <div key={s.label} className="nos-stat-item">
            <span className="nos-stat-num">{s.num}</span>
            <span className="nos-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* QUÉ ES */}
      <section className="nos-section nos-section--alt">
        <div className="nos-container nos-two-col">
          <FadeIn>
            <div className="nos-text-block">
              <span className="nos-tag">Congreso</span>
              <h2>{t.nos_what}</h2>
              <p>{t.nos_what_p}</p>
            </div>
          </FadeIn>
          <FadeIn delay={120}>
            <div className="nos-img-wrap">
              <img src={ieeeImg} alt="Congreso CONIITI" className="nos-section-img" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="nos-section">
        <div className="nos-container nos-two-col nos-two-col--reverse">
          <FadeIn>
            <div className="nos-img-wrap">
              <img src={conferenciaImg} alt="Historia CONIITI" className="nos-section-img" />
            </div>
          </FadeIn>
          <FadeIn delay={120}>
            <div className="nos-text-block">
              <span className="nos-tag">Trayectoria</span>
              <h2>{t.nos_history}</h2>
              <p>{t.nos_history_p}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* UNIVERSIDAD */}
      <section className="nos-section nos-section--uni">
        <img src={frenteSede4} alt="" className="nos-uni-bg" aria-hidden="true" />
        <div className="nos-uni-overlay" />
        <FadeIn>
          <div className="nos-uni-center">
            <img src={logoUcc} alt="Universidad Católica de Colombia" className="nos-uni-logo-main" />
            <div className="nos-uni-divider" />
            <h2>{t.nos_uni}</h2>
            <p>{t.nos_uni_p}</p>
            <a
              href="https://www.ucatolica.edu.co"
              target="_blank"
              rel="noreferrer"
              className="nos-uni-btn"
            >
              {t.nos_visit}
            </a>
          </div>
        </FadeIn>
      </section>

      {/* OBJETIVOS */}
      <section className="nos-section">
        <div className="nos-container">
          <FadeIn>
            <div className="nos-section-header">
              <span className="nos-tag">Misión</span>
              <h2>{t.nos_goals}</h2>
            </div>
          </FadeIn>
          <div className="nos-goals-grid">
            {objetivos.map((obj, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="nos-goal-card">
                  <div className="nos-goal-icon">{obj.icono}</div>
                  <h3>{obj.titulo}</h3>
                  <p>{obj.texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
