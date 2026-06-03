import { useState, useEffect, memo } from "react";
import edificioImg from "../../assets/ucatolica-edificio3.webp";
import "../../css/Noticias.css";

interface Noticia {
  id: number;
  categoria: "congreso" | "ponentes" | "fechas" | "tecnologia" | "convocatoria";
  titulo: string;
  resumen: string;
  fecha: string;
  destacada?: boolean;
  tag: string;
  emoji: string;
}

const NOTICIAS: Noticia[] = [
  {
    id: 1,
    categoria: "congreso",
    titulo: "CONIITI 2026 confirmado en Bogotá — sede Universidad Católica de Colombia",
    resumen: "El XIV Congreso Internacional de Ingeniería Industrial y de Sistemas se celebrará en las instalaciones de la Universidad Católica de Colombia, reuniendo a más de 800 investigadores de 25 países en una edición que apuesta por la innovación sostenible.",
    fecha: "2025-12-10",
    destacada: true,
    tag: "Oficial",
    emoji: "🏛️",
  },
  {
    id: 2,
    categoria: "fechas",
    titulo: "Convocatoria de artículos: fecha límite extendida al 28 de febrero de 2026",
    resumen: "El comité científico ha extendido el plazo para la recepción de artículos completos hasta el 28 de febrero de 2026. Se aceptan trabajos en español, inglés y portugués bajo las normas IEEE. Los trabajos seleccionados serán indexados en Scopus.",
    fecha: "2026-01-15",
    destacada: true,
    tag: "Fechas",
    emoji: "📅",
  },
  {
    id: 3,
    categoria: "ponentes",
    titulo: "Keynote confirmada: Prof. Marco Bertolini del Politecnico di Milano",
    resumen: "El Dr. Bertolini, referente mundial en inteligencia artificial aplicada a manufactura avanzada, impartirá la conferencia inaugural titulada 'Industry 5.0: cuando la IA y el ser humano co-diseñan el futuro'. Cuenta con más de 200 publicaciones en revistas de alto impacto.",
    fecha: "2026-02-03",
    destacada: true,
    tag: "Ponentes",
    emoji: "🎤",
  },
  {
    id: 4,
    categoria: "ponentes",
    titulo: "Dra. Giulia Romano se une como ponente invitada en sostenibilidad",
    resumen: "Experta de la Università di Bologna, la Dra. Romano presentará avances en economía circular e ingeniería verde. Su sesión incluirá un taller práctico sobre métricas de sostenibilidad para proyectos de ingeniería en Latinoamérica.",
    fecha: "2026-02-18",
    tag: "Ponentes",
    emoji: "🌱",
  },
  {
    id: 5,
    categoria: "convocatoria",
    titulo: "Abierta convocatoria para Trabajos de Grado Sobresalientes 2026",
    resumen: "Estudiantes de pregrado y posgrado pueden postular sus proyectos de grado para la competencia nacional. Se otorgarán premios en cinco categorías: Mejor Tesis, Innovación Tecnológica, Impacto Social, Sostenibilidad y Emprendimiento.",
    fecha: "2026-01-20",
    tag: "Convocatoria",
    emoji: "🏆",
  },
  {
    id: 6,
    categoria: "tecnologia",
    titulo: "Nueva plataforma virtual para asistentes remotos y streaming en vivo",
    resumen: "CONIITI 2026 estrenará una plataforma híbrida que permitirá la participación virtual completa: presentaciones en streaming HD, sesiones de preguntas en tiempo real, networking digital y acceso a memorias electrónicas con DOI.",
    fecha: "2026-02-25",
    tag: "Tecnología",
    emoji: "💻",
  },
  {
    id: 7,
    categoria: "fechas",
    titulo: "Programa preliminar publicado: 4 días de actividades del 12 al 15 de mayo",
    resumen: "El programa provisional contempla más de 120 sesiones paralelas, 6 conferencias magistrales, 3 talleres precongreso y la tradicional gala de premiación. Se confirman tracks en IA, IoT, Smart Cities, Bioingeniería y Ciberseguridad.",
    fecha: "2026-03-10",
    tag: "Programa",
    emoji: "📋",
  },
  {
    id: 8,
    categoria: "congreso",
    titulo: "Acuerdo de cooperación con la IEEE Latin America para publicación indexada",
    resumen: "El comité organizador firmó un convenio con IEEE para la publicación de artículos seleccionados en IEEE Xplore. Los trabajos con mayor puntaje serán invitados a edición especial de la revista IEEE Transactions on Engineering Management.",
    fecha: "2026-03-22",
    tag: "Publicaciones",
    emoji: "📚",
  },
  {
    id: 9,
    categoria: "ponentes",
    titulo: "Panel especial: Ingeniería y Emprendimiento con líderes de startups deep-tech",
    resumen: "Un panel de emprendedores de Colombia, México y España debatirá cómo la ingeniería industrial impulsa el ecosistema de startups tecnológicas. Moderado por la Dra. Valeria Ruiz de la UNAM.",
    fecha: "2026-03-30",
    tag: "Ponentes",
    emoji: "🚀",
  },
  {
    id: 10,
    categoria: "convocatoria",
    titulo: "Becas de asistencia disponibles para estudiantes de la región Andina",
    resumen: "El comité organizador anuncia 30 becas de asistencia presencial para estudiantes de Ecuador, Perú, Venezuela y Bolivia. Incluyen inscripción, materiales y acceso a todos los eventos sociales del congreso.",
    fecha: "2026-04-05",
    tag: "Becas",
    emoji: "🎓",
  },
];

const CATEGORIAS = [
  { key: "todas", label: "Todas" },
  { key: "congreso", label: "Congreso" },
  { key: "ponentes", label: "Ponentes" },
  { key: "fechas", label: "Fechas" },
  { key: "convocatoria", label: "Convocatoria" },
  { key: "tecnologia", label: "Tecnología" },
];

function formatFecha(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}



function NoticiaCard({ noticia, destacada, principal }: { noticia: Noticia; destacada?: boolean; principal?: boolean }) {
  const [expandida, setExpandida] = useState(false);

  return (
    <article className={`noticia-card noticia-cat--${noticia.categoria}${destacada ? " noticia-card--destacada" : ""}${principal ? " noticia-card--principal" : ""}`}>
      <div className="noticia-card-top">
        <div className="noticia-badges">
          <span className={`noticia-badge noticia-badge--${noticia.categoria}`}>{noticia.tag}</span>
          {noticia.destacada && <span className="noticia-badge noticia-badge--hot">Destacada</span>}
        </div>
      </div>
      <h3 className="noticia-titulo">{noticia.titulo}</h3>
      <p className={`noticia-resumen${expandida ? " noticia-resumen--expandido" : ""}`}>
        {noticia.resumen}
      </p>
      <div className="noticia-footer">
        <time className="noticia-fecha">{formatFecha(noticia.fecha)}</time>
        <button className="noticia-mas" onClick={() => setExpandida(!expandida)}>
          {expandida ? "Leer menos" : "Leer más"}
        </button>
      </div>
    </article>
  );
}

const TimelineItem = memo(function TimelineItem({ noticia }: { noticia: Noticia }) {
  return (
    <div className="tl-item">
      <div className="tl-dot" />
      <div className="tl-content">
        <span className="tl-fecha">{formatFecha(noticia.fecha)}</span>
        <p className="tl-titulo">{noticia.titulo}</p>
        <span className={`noticia-badge noticia-badge--${noticia.categoria}`}>{noticia.tag}</span>
      </div>
    </div>
  );
});

export default function Noticias() {
  const [catActiva, setCatActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"grid" | "timeline">("grid");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtradas = NOTICIAS.filter(n => {
    const matchCat = catActiva === "todas" || n.categoria === catActiva;
    const matchBusq = busqueda === "" ||
      n.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.resumen.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq;
  });

  const destacadas = NOTICIAS.filter(n => n.destacada);
  const ordenadas = [...filtradas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const proximas = [...NOTICIAS].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  return (
    <div className={`noticias-page${mounted ? " noticias-page--mounted" : ""}`}>

      {/* HERO */}
      <section className="noticias-hero">
        <img src={edificioImg} alt="" className="noticias-hero-img" aria-hidden="true" loading="eager" fetchPriority="high" />
        <div className="noticias-hero-overlay" />
        <div className="noticias-hero-content">
          <div className="noticias-live-pill">
            <span className="noticias-live-dot" /> CONIITI 2026 · Noticias
          </div>
          <h1 className="noticias-hero-title">
            Centro de <span className="noticias-hero-accent">Noticias</span>
          </h1>
          <p className="noticias-hero-sub">
            Toda la actualidad del Congreso Internacional de Ingeniería Industrial y de Sistemas
          </p>
          <div className="noticias-hero-stats">
            <div className="noticias-stat">
              <span className="noticias-stat-num">{NOTICIAS.length}</span>
              <span className="noticias-stat-label">Noticias</span>
            </div>
            <div className="noticias-stat-sep" />
            <div className="noticias-stat">
              <span className="noticias-stat-num">6</span>
              <span className="noticias-stat-label">Categorías</span>
            </div>
            <div className="noticias-stat-sep" />
            <div className="noticias-stat">
              <span className="noticias-stat-num">May 2026</span>
              <span className="noticias-stat-label">Evento</span>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER ÚLTIMA HORA */}
      <div className="noticias-ticker">
        <span className="noticias-ticker-label">ÚLTIMA HORA</span>
        <div className="noticias-ticker-track">
          <div className="noticias-ticker-content">
            {[...NOTICIAS, ...NOTICIAS].map((n, i) => (
              <span key={i} className="noticias-ticker-item">
                {n.titulo} &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="noticias-layout">
        <main className="noticias-main">

          {/* DESTACADAS */}
          <section className="noticias-section">
            <div className="noticias-section-header">
              <h2>Noticias Destacadas</h2>
            </div>
            <div className="noticias-destacadas-grid">
              {destacadas.map((n, i) => (
                <NoticiaCard key={n.id} noticia={n} destacada principal={i === 0} />
              ))}
            </div>
          </section>

          {/* TODAS */}
          <section className="noticias-section">
            <div className="noticias-section-header">
              <h2>Todas las Noticias</h2>
              <div className="noticias-vista-toggle">
                <button
                  className={`noticias-vista-btn${vista === "grid" ? " active" : ""}`}
                  onClick={() => setVista("grid")}
                >Cuadrícula</button>
                <button
                  className={`noticias-vista-btn${vista === "timeline" ? " active" : ""}`}
                  onClick={() => setVista("timeline")}
                >Cronología</button>
              </div>
            </div>

            <div className="noticias-search-wrap">
              <span className="noticias-search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                className="noticias-search"
                placeholder="Buscar noticias..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button className="noticias-search-clear" onClick={() => setBusqueda("")}>✕</button>
              )}
            </div>

            <div className="noticias-cats">
              {CATEGORIAS.map(c => (
                <button
                  key={c.key}
                  className={`noticias-cat-btn${catActiva === c.key ? " active" : ""}`}
                  onClick={() => setCatActiva(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="noticias-count">{ordenadas.length} resultado{ordenadas.length !== 1 ? "s" : ""}</p>

            {vista === "grid" ? (
              <div className="noticias-grid">
                {ordenadas.map(n => (
                  <NoticiaCard key={n.id} noticia={n} />
                ))}
              </div>
            ) : (
              <div className="noticias-timeline">
                {proximas.map(n => <TimelineItem key={n.id} noticia={n} />)}
              </div>
            )}

            {ordenadas.length === 0 && (
              <div className="noticias-empty">
                <span>📭</span>
                <p>No se encontraron noticias para tu búsqueda.</p>
                <button onClick={() => { setBusqueda(""); setCatActiva("todas"); }}>Limpiar filtros</button>
              </div>
            )}
          </section>
        </main>

        <aside className="noticias-aside">
          <div className="noticias-aside-card">
            <h3>Próximas Fechas</h3>
            <div className="noticias-proximas">
              {proximas.slice(0, 6).map(n => (
                <div key={n.id} className="noticias-proxima-item">
                  <div className="np-dot" />
                  <div>
                    <span className="np-fecha">{formatFecha(n.fecha)}</span>
                    <p className="np-titulo">{n.titulo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="noticias-aside-card noticias-aside-card--contact">
            <h3>Prensa y Comunicados</h3>
            <p>¿Tienes una noticia o anuncio para el congreso?</p>
            <a href="mailto:coniiti@ucatolica.edu.co" className="noticias-contact-link">
              coniiti@ucatolica.edu.co
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
