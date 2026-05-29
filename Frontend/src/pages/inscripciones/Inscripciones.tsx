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
  location_text: string | null;
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

const CATEGORIES = ["Todas", "IAAA", "Software", "Redes", "Datos", "Robótica", "Gestión", "Innovación"];

// ── Componente principal ──────────────────────────────────────────────────────

export default function Inscripciones() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const session = getSession();

  function formatDate(iso: string | null): string {
    if (!iso) return t.insc_to_define;
    return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? "es-CO", {
      weekday: "long", year: "numeric", month: "long",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  const [conferences, setConferences]     = useState<Conference[]>([]);
  const [myRegs, setMyRegs]               = useState<Registration[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError]                 = useState("");
  const [toast, setToast]                 = useState("");

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("Todas");

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const fetchConferences = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "Todas") params.set("category", category);
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
    setTimeout(() => setToast(""), 3500);
  }

  function isRegistered(conferenceId: number): Registration | undefined {
    return myRegs.find((r) => r.conference_id === conferenceId);
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
        setConferences((prev) =>
          prev.map((c) =>
            c.id === conf.id ? { ...c, registered_count: c.registered_count + 1 } : c
          )
        );
        showToast(`Inscrito en "${conf.title}"`);
        // Avisa a UserAvatar después de un delay para que la notificación
        // ya esté guardada (el backend la crea en un BackgroundTask)
        setTimeout(() => window.dispatchEvent(new Event("new-notification")), 1500);
      }
    } catch {
      showToast("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(conf: Conference) {
    const reg = isRegistered(conf.id);
    if (!reg) return;
    setActionLoading(conf.id);
    try {
      const res = await fetch(`${SEARCH_URL}/registrations/${reg.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMyRegs((prev) => prev.filter((r) => r.id !== reg.id));
        setConferences((prev) =>
          prev.map((c) =>
            c.id === conf.id ? { ...c, registered_count: c.registered_count - 1 } : c
          )
        );
        showToast(`Inscripción a "${conf.title}" cancelada`);
      } else {
        const data = await res.json();
        showToast(data.detail || "No se pudo cancelar la inscripción");
      }
    } catch {
      showToast("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Filtro local por texto ──────────────────────────────────────────────────

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return conferences;
    return conferences.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      (c.speaker_name ?? "").toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  }, [conferences, search]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="insc-page">

      {/* Toast */}
      {toast && <div className="insc-toast">{toast}</div>}

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
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`insc-filter-btn ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
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

        {/* Sin resultados */}
        {!loading && !error && visible.length === 0 && (
          <div className="insc-empty">
            <p>{t.insc_empty}</p>
          </div>
        )}

        {/* Grid de tarjetas */}
        {!loading && !error && visible.length > 0 && (
          <div className="insc-grid">
            {visible.map((conf) => {
              const reg        = isRegistered(conf.id);
              const isMine     = !!reg;
              const spots      = spotsLeft(conf);
              const full       = spots <= 0;
              const isActing   = actionLoading === conf.id;

              return (
                <article key={conf.id} className={`insc-card ${isMine ? "card-registered" : ""}`}>

                  {/* Cabecera navy con líneas animadas */}
                  <div className="insc-card-header">
                    <svg className="insc-header-curves" viewBox="0 0 300 46" preserveAspectRatio="none" fill="none" aria-hidden="true">
                      <path className="hc hc-1" d="M-20 34 C70 10,150 44,230 24 C275 12,300 30,340 26"/>
                      <path className="hc hc-2" d="M-20 18 C60 4,140 32,220 14 C270 2,300 16,340 12"/>
                    </svg>
                    {conf.category && (
                      <span className="insc-badge-cat">{conf.category}</span>
                    )}
                    {isMine && (
                      <span className="insc-badge-mine">{t.insc_registered_badge}</span>
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
                    {conf.location_text && (
                      <li>
                        <span className="meta-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5C12.5 3.515 10.485 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                        </span>
                        {conf.location_text}
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
                    {isMine ? (
                      <button
                        className="insc-btn-cancel"
                        disabled={isActing}
                        onClick={() => handleCancel(conf)}
                      >
                        {isActing ? t.insc_cancelling : t.insc_cancel}
                      </button>
                    ) : (
                      <button
                        className={`insc-btn-register ${full ? "btn-full" : ""}`}
                        disabled={isActing || full}
                        onClick={() => handleRegister(conf)}
                      >
                        {isActing ? t.insc_registering : full ? t.insc_full : t.insc_register}
                      </button>
                    )}
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
