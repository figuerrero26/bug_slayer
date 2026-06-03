import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import conferenciasBg from "../../assets/conferencias.jpg";
import "../../css/Inscripciones.css";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Conference {
  id: number;
  title: string;
  description: string | null;
  speaker_name: string | null;
  speaker_image_url: string | null;
  category: string | null;
  schedule: string | null;
  campus_name: string | null;
  room_name: string | null;
  capacity: number;
  registered_count: number;
}

interface Registration {
  id: number;
  conference_id: number;
  user_id: number;
  status: string;
}

interface Session {
  token: string;
  user_id: number;
  email: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem("session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const LOCALE_MAP: Record<string, string> = {
  ES: "es-CO", EN: "en-US", IT: "it-IT", PT: "pt-BR", FR: "fr-FR",
};

function spotsLeft(conf: Conference): number {
  return conf.capacity - conf.registered_count;
}

const CATEGORY_FILTERS: { value: string; labelKey: string }[] = [
  { value: "",                                                  labelKey: "ccv_filter_all" },
  { value: "Software Engineering and Information Systems",     labelKey: "cat_software"   },
  { value: "Artificial Intelligence and Co-existence",         labelKey: "cat_ai"         },
  { value: "Smart Cities and Sustainable Development",         labelKey: "cat_cities"     },
  { value: "Security, Privacy and Infrastructure",             labelKey: "cat_security"   },
  { value: "Technology, Society and Innovation",               labelKey: "cat_tech"       },
];

// ── Componente principal ──────────────────────────────────────────────────────

export default function Inscripciones() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const session = getSession();

  function formatDate(iso: string | null): string {
    if (!iso) return t.insc_to_define;
    return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? "es-CO", {
      weekday: "long", year: "numeric", month: "long",
      day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  }

  function translateCat(cat: string | null): string {
    if (!cat) return "";
    const entry = CATEGORY_FILTERS.find((f) => f.value === cat);
    return entry ? (t[entry.labelKey] ?? cat) : cat;
  }

  const [conferences, setConferences]     = useState<Conference[]>([]);
  const [myRegs, setMyRegs]               = useState<Registration[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError]                 = useState("");
  const [toast, setToast]                 = useState<string | null>(null);
  const [tipToast, setTipToast]           = useState(false);
  const [fadingOutId, setFadingOutId]     = useState<number | null>(null);

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const fetchConferences = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const res = await fetch(`${SEARCH_URL}/conferences?${params}`);
      if (!res.ok) throw new Error("Error al cargar conferencias");
      const data: Conference[] = await res.json();
      setConferences(data);
    } catch (e: any) {
      setError(e.message || "Error de conexión con el servidor");
    }
  }, [category]);

  const fetchMyRegistrations = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${SEARCH_URL}/registrations/user/${session.user_id}`);
      if (res.ok) {
        const data: Registration[] = await res.json();
        setMyRegs(data);
      }
    } catch {
      // no bloquea si falla
    }
  }, [session?.user_id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchConferences(), fetchMyRegistrations()]).finally(() =>
      setLoading(false)
    );
  }, [fetchConferences, fetchMyRegistrations]);

  // ── Acciones ────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function showSmartToast(title: string) {
    showToast(`¡Inscripción exitosa a "${title}"!`);
    if (!sessionStorage.getItem("is_dashboard_aware")) {
      sessionStorage.setItem("is_dashboard_aware", "1");
      setTipToast(true);
      setTimeout(() => setTipToast(false), 6000);
    }
  }

  async function handleRegister(conf: Conference) {
    if (!session) {
      navigate("/login");
      return;
    }
    setActionLoading(conf.id);
    try {
      const res = await fetch(`${SEARCH_URL}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conference_id: conf.id, user_id: session.user_id, email: session.email}),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || "No se pudo completar la inscripción");
      } else {
        setMyRegs((prev) => [...prev, data]);
        setFadingOutId(conf.id);
        showSmartToast(conf.title);
        setTimeout(() => window.dispatchEvent(new Event("new-notification")), 1500);
      }
    } catch {
      showToast("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Filtro local por texto + excluir ya inscritas ──────────────────────────

  const registeredIds = useMemo(
    () => new Set(myRegs.map((r) => r.conference_id)),
    [myRegs]
  );

  // Conferencias que el usuario aún no ha inscrito (excluye la que está animándose)
  const availableCount = useMemo(
    () => conferences.filter((c) => !registeredIds.has(c.id) || c.id === fadingOutId).length,
    [conferences, registeredIds, fadingOutId]
  );

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return conferences.filter((c) => {
      // Mantener visible la tarjeta que está en animación de salida
      if (registeredIds.has(c.id) && c.id !== fadingOutId) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.speaker_name ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [conferences, search, registeredIds, fadingOutId]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="insc-page">

      {/* Toast de confirmación — centro inferior */}
      {toast && <div className="insc-toast">{toast}</div>}

      {/* Tip flotante — lateral derecho, solo primera inscripción */}
      {tipToast && (
        <div className="insc-tip-toast">
          <span className="insc-tip-toast__icon">💡</span>
          <p className="insc-tip-toast__text">
            Recuerda que puedes gestionar tus ferias inscritas, modificar tu información
            personal y descargar tus certificados directamente desde tu{" "}
            <strong>Dashboard</strong>.
          </p>
          <button
            className="insc-tip-toast__close"
            aria-label="Cerrar"
            onClick={() => setTipToast(false)}
          >✕</button>
        </div>
      )}

      {/* Hero */}
      <section className="insc-hero" style={{ ["--conf-img" as string]: `url(${conferenciasBg})` }}>
        <h1 className="insc-hero-title">{t.insc_title}</h1>
        <p className="insc-hero-sub">{t.insc_sub}</p>

        <div className="insc-search-bar">
          <span className="insc-search-icon">
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="1.8"/>
              <path d="M14.5 14.5L18 18" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            className="insc-search-input"
            placeholder={t.insc_search_ph}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar conferencias"
          />
        </div>
      </section>

      {/* Filtros por categoría */}
      <div className="insc-filters">
        {CATEGORY_FILTERS.map(({ value, labelKey }) => (
          <button
            key={value || "__all__"}
            className={`insc-filter-btn ${category === value ? "active" : ""}`}
            onClick={() => setCategory(value)}
          >
            {t[labelKey]}
          </button>
        ))}
      </div>

      {/* Cuerpo */}
      <main className="insc-main">

        {/* Carga */}
        {loading && (
          <div className="insc-loading">
            <div className="insc-spinner" />
            <p>{t.insc_loading}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="insc-error">
            <p>{error}</p>
            <button onClick={() => { setError(""); fetchConferences(); }}>{t.insc_retry}</button>
          </div>
        )}

        {/* Todas inscritas / sin eventos programados */}
        {!loading && !error && availableCount === 0 && (
          <div className="insc-all-done">
            <div className="insc-all-done__icon" aria-hidden="true">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#03124e"/>
                <path d="M28 14c-7.732 0-14 6.268-14 14s6.268 14 14 14 14-6.268 14-14S35.732 14 28 14z"
                  fill="none" stroke="#FFD100" strokeWidth="2"/>
                <path d="M20 28.5l5.5 5.5 10.5-11" stroke="#FFD100" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="insc-all-done__title">
              ¡Estás al día con la agenda!
            </h2>
            <p className="insc-all-done__desc">
              Ya aseguraste tu lugar en todos los eventos disponibles de CONIITI.
              Puedes revisar tus horarios, salas y descargar tus certificados en cualquier momento.
            </p>
            <button
              className="insc-all-done__cta"
              onClick={() => navigate("/dashboard")}
            >
              Ir a mi Dashboard
            </button>
          </div>
        )}

        {/* Sin resultados por búsqueda o filtro activo */}
        {!loading && !error && availableCount > 0 && visible.length === 0 && (
          <div className="insc-empty">
            <p>{t.insc_empty}</p>
          </div>
        )}

        {/* Grid de tarjetas */}
        {!loading && !error && visible.length > 0 && (
          <div className="insc-grid">
            {visible.map((conf) => {
              const spots    = spotsLeft(conf);
              const full     = spots <= 0;
              const isActing = actionLoading === conf.id;

              return (
                <article
                  key={conf.id}
                  className={`insc-card${fadingOutId === conf.id ? " card-fade-out" : ""}`}
                  onAnimationEnd={() => {
                    if (conf.id === fadingOutId) {
                      setConferences((prev) => prev.filter((c) => c.id !== conf.id));
                      setFadingOutId(null);
                    }
                  }}
                >

                  {/* Cabecera navy con líneas animadas */}
                  <div className="insc-card-header">
                    <svg className="insc-header-curves" viewBox="0 0 300 46" preserveAspectRatio="none" fill="none" aria-hidden="true">
                      <path className="hc hc-1" d="M-20 34 C70 10,150 44,230 24 C275 12,300 30,340 26"/>
                      <path className="hc hc-2" d="M-20 18 C60 4,140 32,220 14 C270 2,300 16,340 12"/>
                    </svg>
                    {conf.category && (
                      <span className="insc-badge-cat">
                        {translateCat(conf.category)}
                      </span>
                    )}
                  </div>

                  {/* Cuerpo */}
                  <div className="insc-card-body">
                  <h2 className="insc-card-title">{conf.title}</h2>

                  {conf.description && (
                    <p className="insc-card-desc">{conf.description}</p>
                  )}

                  {/* Avatar del ponente */}
                  {conf.speaker_name && (
                    <div className="insc-speaker-row">
                      {conf.speaker_image_url
                        ? <img
                            src={conf.speaker_image_url.startsWith("http") ? conf.speaker_image_url : `${SEARCH_URL}${conf.speaker_image_url}`}
                            alt={conf.speaker_name}
                            className="insc-speaker-avatar"
                            loading="lazy"
                            decoding="async"
                          />
                        : <div className="insc-speaker-initials">
                            <svg viewBox="0 0 32 32" fill="none" width="22" height="22" aria-hidden="true">
                              <circle cx="16" cy="12" r="6" fill="currentColor" opacity="0.55"/>
                              <path d="M3 30c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="currentColor" opacity="0.55"/>
                            </svg>
                          </div>
                      }
                      <span className="insc-speaker-name">{conf.speaker_name}</span>
                    </div>
                  )}

                  <ul className="insc-card-meta">
                    {conf.speaker_name && (
                      <li>
                        <span className="meta-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </span>
                        {conf.speaker_name}
                      </li>
                    )}
                    {conf.schedule && (
                      <li>
                        <span className="meta-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7h12" stroke="currentColor" strokeWidth="1.5"/><path d="M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </span>
                        {formatDate(conf.schedule)}
                      </li>
                    )}
                    {conf.campus_name && (
                      <li>
                        <span className="meta-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5C12.5 3.515 10.485 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                        </span>
                        {conf.campus_name}{conf.room_name ? ` · ${conf.room_name}` : ""}
                      </li>
                    )}
                    <li>
                      <span className="meta-icon" aria-hidden="true">
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="3" y="2" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9v4M11 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 11h6" stroke="currentColor" strokeWidth="1.5"/></svg>
                      </span>
                      {full
                        ? t.insc_spots_none
                        : `${spots} ${spots !== 1 ? t.insc_spots_pl : t.insc_spots}`}
                    </li>
                  </ul>

                  <div className="insc-card-footer">
                    <button
                      className={`insc-btn-register ${full ? "btn-full" : ""}`}
                      disabled={isActing || full}
                      onClick={() => handleRegister(conf)}
                    >
                      {isActing ? t.insc_registering : full ? t.insc_full : t.insc_register}
                    </button>
                  </div>
                  </div>{/* /insc-card-body */}

                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
