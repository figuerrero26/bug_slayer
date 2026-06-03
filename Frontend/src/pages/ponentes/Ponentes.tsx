import { useState, useEffect, useRef } from "react";
import { useLang } from "../../context/LanguageContext";
import {
  Speaker,
  loadSpeakers,
  getExpLabel,
  getExpClass,
  AREAS_LIST,
  PROFESSIONS_LIST,
} from "../../interfaces/ponente";
import ponentesHero from "../../assets/ponententesimagen.webp";
import "../../css/Ponentes.css";

const AREAS_FILTER  = ["Todos", ...AREAS_LIST];
const PROF_FILTER   = ["Todas", ...PROFESSIONS_LIST];
const EXP_LABELS    = ["Todos", "Emergente", "En desarrollo", "Experimentado", "Experto"];
const EXP_RANGE: Record<string, [number, number]> = {
  "Todos":          [0,  999],
  "Emergente":      [1,    7],
  "En desarrollo":  [8,   14],
  "Experimentado":  [15,  21],
  "Experto":        [22, 999],
};
const EXP_SUB: Record<string, string> = {
  "Emergente":     "1–7 años",
  "En desarrollo": "8–14 años",
  "Experimentado": "15–21 años",
  "Experto":       "22+ años",
};

export default function Ponentes() {
  const { t } = useLang();

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [search,   setSearch]   = useState("");
  const [area,     setArea]     = useState("Todos");
  const [prof,     setProf]     = useState("Todas");
  const [exp,      setExp]      = useState("Todos");
  const [sortBy,   setSortBy]   = useState<"exp-desc" | "exp-asc" | "name">("exp-desc");
  const [selected, setSelected] = useState<Speaker | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSpeakers(loadSpeakers()); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll(".speaker-card.reveal");
      const obs = new IntersectionObserver(
        es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("active"); }),
        { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
      );
      cards.forEach(c => obs.observe(c));
      return () => obs.disconnect();
    }, 80);
    return () => clearTimeout(timer);
  }, [speakers, area, prof, exp, search, sortBy]);

  // Close modal on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const keynotes = speakers.filter(s => s.keynote);

  const filtered = speakers
    .filter(s => !s.keynote)
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.institution.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q) ||
        s.profession.toLowerCase().includes(q)
      );
    })
    .filter(s => area === "Todos" || s.area === area)
    .filter(s => prof === "Todas" || s.profession === prof)
    .filter(s => {
      const [min, max] = EXP_RANGE[exp];
      return s.experience >= min && s.experience <= max;
    })
    .sort((a, b) => {
      if (sortBy === "name")     return a.name.localeCompare(b.name, "es");
      if (sortBy === "exp-desc") return b.experience - a.experience;
      return a.experience - b.experience;
    });

  const totalCountries = new Set(speakers.map(s => s.countryName)).size;
  const totalAreas     = new Set(speakers.filter(s => !s.keynote).map(s => s.area)).size;

  const hasActiveFilters = area !== "Todos" || prof !== "Todas" || exp !== "Todos" || search !== "";

  function clearAll() {
    setArea("Todos");
    setProf("Todas");
    setExp("Todos");
    setSearch("");
  }

  return (
    <div className="ponentes-page">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="ponentes-hero"
        style={{ ["--hero-img" as string]: `url(${ponentesHero})` }}
      >
        <div className="ponentes-hero-ribbons" aria-hidden="true">
          <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
            <path className="p-ribbon p-ribbon-1" d="M -60 180 C 300 120, 700 200, 1100 150 C 1300 120, 1420 180, 1520 155" />
            <path className="p-ribbon p-ribbon-2" d="M -60 200 C 350 140, 750 215, 1150 168 C 1330 140, 1440 195, 1530 170" />
            <path className="p-ribbon p-ribbon-3" d="M -60 160 C 280 100, 680 178, 1080 132 C 1280 105, 1400 162, 1510 138" />
          </svg>
        </div>
        <div className="ponentes-hero-content">
          <span className="ponentes-hero-badge">{t.ponentes_badge ?? "CONIITI 2026 · País invitado Italia"}</span>
          <h1>{t.ponentes_title ?? "Ponentes 2026"}</h1>
          <p>{t.ponentes_subtitle ?? "95 expertos internacionales · más de 20 países · ingeniería del futuro"}</p>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <div className="ponentes-stats-bar">
        <div className="stat-item">
          <span className="stat-value">{speakers.length}</span>
          <span className="stat-label">Ponentes</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-value">{keynotes.length}</span>
          <span className="stat-label">Keynotes</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-value">{totalCountries}</span>
          <span className="stat-label">Países</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-item">
          <span className="stat-value">{totalAreas}</span>
          <span className="stat-label">Áreas</span>
        </div>
      </div>

      {/* ── Keynotes ───────────────────────────────────────────────── */}
      {keynotes.length > 0 && (
        <section className="ponentes-keynotes">
          <h2 className="ponentes-section-title">
            <span className="ponentes-section-line" />
            {t.ponentes_keynote ?? "Conferencistas principales"}
            <span className="ponentes-section-line" />
          </h2>
          <div className="keynotes-grid">
            {keynotes.map(sp => (
              <article
                key={sp.id}
                className="keynote-card"
                onClick={() => setSelected(sp)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setSelected(sp)}
              >
                <div className="keynote-avatar">
                  <svg viewBox="0 0 32 32" fill="none" width="34" height="34" aria-hidden="true">
                    <circle cx="16" cy="12" r="6" fill="currentColor" opacity="0.65"/>
                    <path d="M3 30c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="currentColor" opacity="0.65"/>
                  </svg>
                </div>
                <div className="keynote-info">
                  <div className="keynote-badges">
                    <span className="keynote-badge-italy">{sp.country} {sp.countryName} · Keynote</span>
                    <span className={`exp-badge exp-badge--${getExpClass(sp.experience)}`}>
                      {getExpLabel(sp.experience)} · {sp.experience} años
                    </span>
                  </div>
                  <h3>{sp.name}</h3>
                  <p className="keynote-institution">{sp.institution}</p>
                  <p className="keynote-topic">"{sp.topic}"</p>
                  <div className="keynote-footer">
                    <span className="area-tag">{sp.area}</span>
                    <span className={`profession-tag profession-tag--${sp.profession.toLowerCase()}`}>{sp.profession}</span>
                    <span className="keynote-hint">Ver perfil →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Panel de filtros ───────────────────────────────────────── */}
      <div className="ponentes-filter-wrap">
        <div className="filter-top-row">
          {/* Search */}
          <div className="filter-search-box">
            <svg className="filter-search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M14.5 14.5 L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, institución, país, área…"
              className="filter-search-input"
              aria-label="Buscar ponentes"
            />
            {search && (
              <button className="filter-search-clear" onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Sort + Toggle filters */}
          <div className="filter-controls">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="filter-sort-select"
              aria-label="Ordenar ponentes"
            >
              <option value="exp-desc">Mayor experiencia</option>
              <option value="exp-asc">Menor experiencia</option>
              <option value="name">Nombre A–Z</option>
            </select>
            <button
              className={`filter-toggle-btn${filtersOpen ? " open" : ""}`}
              onClick={() => setFiltersOpen(v => !v)}
              aria-expanded={filtersOpen}
            >
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M2 5h16M5 10h10M8 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Filtros
              {hasActiveFilters && <span className="filter-active-dot" />}
            </button>
            {hasActiveFilters && (
              <button className="filter-clear-all" onClick={clearAll}>Limpiar</button>
            )}
          </div>
        </div>

        {/* Expandable filter rows */}
        <div className={`filter-drawer${filtersOpen ? " open" : ""}`}>
          {/* Area */}
          <div className="filter-group">
            <span className="filter-group-label">Área técnica</span>
            <div className="filter-pills">
              {AREAS_FILTER.map(a => (
                <button
                  key={a}
                  className={`filter-pill${area === a ? " active" : ""}`}
                  onClick={() => setArea(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Profession */}
          <div className="filter-group">
            <span className="filter-group-label">Profesión</span>
            <div className="filter-pills">
              {PROF_FILTER.map(p => (
                <button
                  key={p}
                  className={`filter-pill prof-pill prof-pill--${p.toLowerCase()}${prof === p ? " active" : ""}`}
                  onClick={() => setProf(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="filter-group">
            <span className="filter-group-label">Nivel de experiencia</span>
            <div className="filter-pills">
              {EXP_LABELS.map(e => (
                <button
                  key={e}
                  className={`filter-pill exp-pill exp-pill--${e.toLowerCase().replace(/ /g, "-")}${exp === e ? " active" : ""}`}
                  onClick={() => setExp(e)}
                >
                  <span>{e}</span>
                  {e !== "Todos" && <span className="exp-pill-sub">{EXP_SUB[e]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="filter-results-row">
          <span className="filter-results-count">
            {filtered.length} ponente{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters && " encontrado" + (filtered.length !== 1 ? "s" : "")}
          </span>
        </div>
      </div>

      {/* ── Grid de ponentes ───────────────────────────────────────── */}
      <section className="ponentes-grid-section">
        <div className="ponentes-grid" ref={gridRef}>
          {filtered.map((sp, i) => (
            <article
              key={sp.id}
              className="speaker-card reveal"
              style={{ transitionDelay: `${(i % 8) * 45}ms` }}
              onClick={() => setSelected(sp)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setSelected(sp)}
              aria-label={`Ver perfil de ${sp.name}`}
            >
              <div className="speaker-card-header">
                <svg className="speaker-header-curves" viewBox="0 0 200 70" preserveAspectRatio="none" fill="none" aria-hidden="true">
                  <path className="hc hc-1" d="M-10 52 C45 28,95 60,155 40 C190 26,210 46,240 40"/>
                  <path className="hc hc-2" d="M-10 22 C40 6,90 34,150 18 C188 6,212 24,240 16"/>
                </svg>
                <div className="speaker-avatar">
                  <svg viewBox="0 0 32 32" fill="none" width="28" height="28" aria-hidden="true">
                    <circle cx="16" cy="12" r="6" fill="currentColor" opacity="0.55"/>
                    <path d="M3 30c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="currentColor" opacity="0.55"/>
                  </svg>
                </div>
                <span className="speaker-flag" aria-hidden="true">{sp.country}</span>
              </div>

              <div className="speaker-card-body">
                <h3 className="speaker-name">{sp.name}</h3>
                <p className="speaker-institution">{sp.institution} · {sp.countryName}</p>
                <div className="speaker-tags">
                  <span className="area-tag">{sp.area}</span>
                  <span className="profession-tag">{sp.profession}</span>
                </div>
                <div className="speaker-exp-row">
                  <div className="speaker-exp-bar">
                    <div
                      className="exp-bar-fill"
                      style={{ width: `${Math.min(100, Math.round((sp.experience / 35) * 100))}%` }}
                    />
                  </div>
                  <div className="speaker-exp-footer">
                    <span className={`exp-badge exp-badge--${getExpClass(sp.experience)}`}>
                      {getExpLabel(sp.experience)}
                    </span>
                    <span className="exp-years">{sp.experience} años</span>
                  </div>
                </div>
                <div className="speaker-card-hint" aria-hidden="true">Ver perfil →</div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="ponentes-empty">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <circle cx="24" cy="24" r="20" stroke="#d1d5db" strokeWidth="2"/>
              <path d="M16 24h16M24 16v16" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{t.ponentes_empty ?? "No hay ponentes con los filtros seleccionados."}</p>
            <button className="empty-clear-btn" onClick={clearAll}>Limpiar todos los filtros</button>
          </div>
        )}
      </section>

      {/* ── Modal de detalle ───────────────────────────────────────── */}
      {selected && (
        <div
          className="speaker-modal-overlay"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Perfil de ${selected.name}`}
        >
          <div className="speaker-modal" onClick={e => e.stopPropagation()}>
            <button className="speaker-modal-close" onClick={() => setSelected(null)} aria-label="Cerrar">
              <svg viewBox="0 0 14 14" fill="none" width="14" height="14" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="speaker-modal-header" style={{ background: selected.gradient }}>
              <div className="speaker-modal-avatar">
                <svg viewBox="0 0 32 32" fill="none" width="38" height="38" aria-hidden="true">
                  <circle cx="16" cy="12" r="6" fill="currentColor" opacity="0.8"/>
                  <path d="M3 30c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="currentColor" opacity="0.8"/>
                </svg>
              </div>
              <span className="speaker-modal-flag" aria-hidden="true">{selected.country}</span>
            </div>

            <div className="speaker-modal-body">
              {selected.keynote && (
                <span className="keynote-badge-pill">Keynote Speaker</span>
              )}
              <h2 className="speaker-modal-name">{selected.name}</h2>
              <p className="speaker-modal-institution">{selected.institution} · {selected.countryName}</p>

              <div className="speaker-modal-tags">
                <span className="area-tag">{selected.area}</span>
                <span className={`profession-tag profession-tag--${selected.profession.toLowerCase()}`}>
                  {selected.profession}
                </span>
                <span className={`exp-badge exp-badge--${getExpClass(selected.experience)}`}>
                  {getExpLabel(selected.experience)}
                </span>
              </div>

              <blockquote className="speaker-modal-topic">
                <span className="topic-quote">"</span>
                {selected.topic}
                <span className="topic-quote">"</span>
              </blockquote>

              <p className="speaker-modal-bio">{selected.bio}</p>

              <div className="speaker-modal-exp-section">
                <div className="modal-exp-header">
                  <span className="modal-exp-label">Trayectoria profesional</span>
                  <span className="modal-exp-years">{selected.experience} años de experiencia</span>
                </div>
                <div className="modal-exp-track">
                  <div
                    className="modal-exp-fill"
                    style={{ width: `${Math.min(100, Math.round((selected.experience / 35) * 100))}%` }}
                  />
                </div>
                <div className="modal-exp-scale">
                  <span>Emergente</span>
                  <span>En desarrollo</span>
                  <span>Experimentado</span>
                  <span>Experto</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
