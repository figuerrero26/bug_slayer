import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import "../../css/Ponentes.css";

const AREAS_ES = ["Todos", "IA & Machine Learning", "IoT & Industria 4.0", "Sostenibilidad", "Smart Cities", "Ciberseguridad", "Bioingeniería"];

interface Speaker {
  name: string;
  institution: string;
  country: string;
  countryName: string;
  area: string;
  topic: string;
  keynote?: boolean;
  initials: string;
  gradient: string;
}

const SPEAKERS: Speaker[] = [
  {
    name: "Prof. Marco Bertolini",
    institution: "Politecnico di Milano",
    country: "🇮🇹", countryName: "Italia",
    area: "IA & Machine Learning",
    topic: "Inteligencia artificial aplicada a la manufactura avanzada",
    keynote: true,
    initials: "MB",
    gradient: "linear-gradient(135deg, #009246, #ce2b37)",
  },
  {
    name: "Dra. Giulia Romano",
    institution: "Università di Bologna",
    country: "🇮🇹", countryName: "Italia",
    area: "Sostenibilidad",
    topic: "Ingeniería verde y economía circular en la era digital",
    keynote: true,
    initials: "GR",
    gradient: "linear-gradient(135deg, #ce2b37, #009246)",
  },
  {
    name: "Dr. James Chen",
    institution: "Massachusetts Institute of Technology",
    country: "🇺🇸", countryName: "EE.UU.",
    area: "IA & Machine Learning",
    topic: "Deep learning para sistemas embebidos de alta eficiencia",
    initials: "JC",
    gradient: "linear-gradient(135deg, #0055cc, #2b7fff)",
  },
  {
    name: "Prof. Sarah Mitchell",
    institution: "Imperial College London",
    country: "🇬🇧", countryName: "Reino Unido",
    area: "Smart Cities",
    topic: "Infraestructuras cognitivas para ciudades inteligentes",
    initials: "SM",
    gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
  },
  {
    name: "Ing. Andrés Torres",
    institution: "Universidad Católica de Colombia",
    country: "🇨🇴", countryName: "Colombia",
    area: "IoT & Industria 4.0",
    topic: "Redes de sensores distribuidos en entornos industriales",
    initials: "AT",
    gradient: "linear-gradient(135deg, #fcd116, #003893)",
  },
  {
    name: "Dra. Valeria Ruiz",
    institution: "Universidad Nacional Autónoma de México",
    country: "🇲🇽", countryName: "México",
    area: "Bioingeniería",
    topic: "Dispositivos bioelectrónicos implantables de nueva generación",
    initials: "VR",
    gradient: "linear-gradient(135deg, #006847, #ce1126)",
  },
  {
    name: "Prof. Carlos Medina",
    institution: "Universidad de Buenos Aires",
    country: "🇦🇷", countryName: "Argentina",
    area: "Ciberseguridad",
    topic: "Arquitecturas zero-trust en redes críticas de infraestructura",
    initials: "CM",
    gradient: "linear-gradient(135deg, #74acdf, #3a6fc0)",
  },
  {
    name: "Dra. Patricia Lima",
    institution: "Universidade de São Paulo",
    country: "🇧🇷", countryName: "Brasil",
    area: "Sostenibilidad",
    topic: "Transición energética y microrredes eléctricas renovables",
    initials: "PL",
    gradient: "linear-gradient(135deg, #009c3b, #fedf00)",
  },
  {
    name: "Dr. Ahmed Hassan",
    institution: "Cairo University",
    country: "🇪🇬", countryName: "Egipto",
    area: "Smart Cities",
    topic: "Gestión hídrica inteligente con sensórica urbana",
    initials: "AH",
    gradient: "linear-gradient(135deg, #c43e1c, #f26522)",
  },
  {
    name: "Prof. Yuki Tanaka",
    institution: "Tokyo Institute of Technology",
    country: "🇯🇵", countryName: "Japón",
    area: "IoT & Industria 4.0",
    topic: "Robótica colaborativa y cobots en entornos flexibles",
    initials: "YT",
    gradient: "linear-gradient(135deg, #bc002d, #ff6b8a)",
  },
  {
    name: "Ing. Felipe Herrera",
    institution: "Universidad Nacional de Colombia",
    country: "🇨🇴", countryName: "Colombia",
    area: "Smart Cities",
    topic: "Transformación digital de sistemas de transporte urbano",
    initials: "FH",
    gradient: "linear-gradient(135deg, #057a55, #0ea5e9)",
  },
  {
    name: "Dra. Marcela Ospina",
    institution: "Universidad de los Andes",
    country: "🇨🇴", countryName: "Colombia",
    area: "IA & Machine Learning",
    topic: "Modelos predictivos para mantenimiento industrial preventivo",
    initials: "MO",
    gradient: "linear-gradient(135deg, #be185d, #ec4899)",
  },
];

export default function Ponentes() {
  const { t } = useLang();
  const [activeArea, setActiveArea] = useState("Todos");

  const areas = AREAS_ES;
  const keynotes = SPEAKERS.filter(s => s.keynote);
  const filtered = activeArea === "Todos"
    ? SPEAKERS.filter(s => !s.keynote)
    : SPEAKERS.filter(s => !s.keynote && s.area === activeArea);

  return (
    <div className="ponentes-page">

      {/* ── HERO ── */}
      <section className="ponentes-hero">
        <div className="ponentes-hero-ribbons" aria-hidden="true">
          <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
            <path className="p-ribbon p-ribbon-1" d="M -60 180 C 300 120, 700 200, 1100 150 C 1300 120, 1420 180, 1520 155" />
            <path className="p-ribbon p-ribbon-2" d="M -60 200 C 350 140, 750 215, 1150 168 C 1330 140, 1440 195, 1530 170" />
            <path className="p-ribbon p-ribbon-3" d="M -60 160 C 280 100, 680 178, 1080 132 C 1280 105, 1400 162, 1510 138" />
          </svg>
        </div>
        <div className="ponentes-hero-content">
          <span className="ponentes-hero-badge">{t.ponentes_badge ?? "CONIITI 2026 · País invitado 🇮🇹"}</span>
          <h1>{t.ponentes_title ?? "Conferencistas"}</h1>
          <p>{t.ponentes_subtitle ?? "95 expertos internacionales · más de 20 países · ingeniería del futuro"}</p>
        </div>
      </section>

      {/* ── KEYNOTES DESTACADOS ── */}
      <section className="ponentes-keynotes">
        <h2 className="ponentes-section-title">
          <span className="ponentes-section-line" />
          {t.ponentes_keynote ?? "Conferencistas principales"}
          <span className="ponentes-section-line" />
        </h2>
        <div className="keynotes-grid">
          {keynotes.map(sp => (
            <article key={sp.name} className="keynote-card">
              <div className="keynote-avatar" style={{ background: sp.gradient }}>
                <span>{sp.initials}</span>
              </div>
              <div className="keynote-info">
                <span className="keynote-badge-italy">{sp.country} {sp.countryName} · Keynote</span>
                <h3>{sp.name}</h3>
                <p className="keynote-institution">{sp.institution}</p>
                <p className="keynote-topic">"{sp.topic}"</p>
                <span className="area-tag">{sp.area}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── FILTROS ── */}
      <div className="ponentes-filters">
        {areas.map(area => (
          <button
            key={area}
            className={`filter-btn${activeArea === area ? " filter-btn--active" : ""}`}
            onClick={() => setActiveArea(area)}
          >
            {area}
          </button>
        ))}
      </div>

      {/* ── GRID DE PONENTES ── */}
      <section className="ponentes-grid-section">
        <div className="ponentes-grid">
          {filtered.map(sp => (
            <article key={sp.name} className="speaker-card reveal">
              <div className="speaker-avatar" style={{ background: sp.gradient }}>
                <span>{sp.initials}</span>
              </div>
              <div className="speaker-flag">{sp.country}</div>
              <h3 className="speaker-name">{sp.name}</h3>
              <p className="speaker-institution">{sp.institution}</p>
              <p className="speaker-country-name">{sp.countryName}</p>
              <span className="area-tag">{sp.area}</span>
              <p className="speaker-topic">"{sp.topic}"</p>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="ponentes-empty">
            <p>{t.ponentes_empty ?? "No hay ponentes en esta área por el momento."}</p>
          </div>
        )}
      </section>

    </div>
  );
}
