import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH_URL } from "./config";
import "./css/Inscripciones.css";

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

function formatDate(iso: string | null): string {
  if (!iso) return "Por definir";
  return new Date(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function spotsLeft(conf: Conference): number {
  return conf.capacity - conf.registered_count;
}

const CATEGORIES = ["Todas", "IAA", "Software", "Redes", "Datos", "Robótica", "Gestión", "Innovación"];

// ── Componente principal ──────────────────────────────────────────────────────

export default function Inscripciones() {
  const navigate = useNavigate();
  const session = getSession();

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
        body: JSON.stringify({ conference_id: conf.id, user_id: session.user_id }),
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

  const visible = conferences.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.speaker_name ?? "").toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="insc-page">

      {/* Toast */}
      {toast && <div className="insc-toast">{toast}</div>}

      {/* Hero */}
      <section className="insc-hero">
        <h1 className="insc-hero-title">Conferencias CONIITTI 2026</h1>
        <p className="insc-hero-sub">
          Explora el catálogo de charlas y regístrate en las que más te interesen
        </p>

        <div className="insc-search-bar">
          <span className="insc-search-icon">🔍</span>
          <input
            className="insc-search-input"
            placeholder="Buscar por título, ponente o tema…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            <p>Cargando conferencias…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="insc-error">
            <p>{error}</p>
            <button onClick={() => { setError(""); fetchConferences(); }}>Reintentar</button>
          </div>
        )}

        {/* Sin resultados */}
        {!loading && !error && visible.length === 0 && (
          <div className="insc-empty">
            <p>No se encontraron conferencias con esos filtros.</p>
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

                  {/* Badge categoría */}
                  {conf.category && (
                    <span className="insc-badge-cat">{conf.category}</span>
                  )}

                  {/* Badge inscrito */}
                  {isMine && (
                    <span className="insc-badge-mine">Inscrito</span>
                  )}

                  <h2 className="insc-card-title">{conf.title}</h2>

                  {conf.description && (
                    <p className="insc-card-desc">{conf.description}</p>
                  )}

                  {/* Avatar del ponente */}
                  {conf.speaker_name && (
                    <div className="insc-speaker-row">
                      {conf.speaker_image_url
                        ? <img
                            src={`${SEARCH_URL}${conf.speaker_image_url}`}
                            alt={conf.speaker_name}
                            className="insc-speaker-avatar"
                          />
                        : <div className="insc-speaker-initials">
                            {conf.speaker_name[0].toUpperCase()}
                          </div>
                      }
                      <span className="insc-speaker-name">{conf.speaker_name}</span>
                    </div>
                  )}

                  <ul className="insc-card-meta">
                    {conf.speaker_name && (
                      <li>
                        <span className="meta-icon">👤</span>
                        {conf.speaker_name}
                      </li>
                    )}
                    {conf.schedule && (
                      <li>
                        <span className="meta-icon">📅</span>
                        {formatDate(conf.schedule)}
                      </li>
                    )}
                    {conf.location_text && (
                      <li>
                        <span className="meta-icon">📍</span>
                        {conf.location_text}
                      </li>
                    )}
                    <li>
                      <span className="meta-icon">🪑</span>
                      {full
                        ? "Sin cupos disponibles"
                        : `${spots} cupo${spots !== 1 ? "s" : ""} disponible${spots !== 1 ? "s" : ""}`}
                    </li>
                  </ul>

                  <div className="insc-card-footer">
                    {isMine ? (
                      <button
                        className="insc-btn-cancel"
                        disabled={isActing}
                        onClick={() => handleCancel(conf)}
                      >
                        {isActing ? "Cancelando…" : "Cancelar inscripción"}
                      </button>
                    ) : (
                      <button
                        className={`insc-btn-register ${full ? "btn-full" : ""}`}
                        disabled={isActing || full}
                        onClick={() => handleRegister(conf)}
                      >
                        {isActing ? "Inscribiendo…" : full ? "Sin cupos" : "Inscribirme"}
                      </button>
                    )}
                  </div>

                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
