import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH_URL } from "../../services/api";
import "./InscritasView.css";

import type { Conference } from "../../interfaces/conference";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "confirmada" | "en-curso" | "finalizada";

const STATUS_LABEL: Record<Status, string> = {
  "confirmada": "Confirmada",
  "en-curso":   "En curso",
  "finalizada": "Finalizada",
};

const STATUS_PRIORITY: Record<Status, number> = {
  "en-curso":   0,
  "confirmada": 1,
  "finalizada": 2,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatus(schedule: string | null): Status {
  if (!schedule) return "confirmada";
  const d   = new Date(schedule);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000);
  if (d >= todayStart && d < todayEnd) return "en-curso";
  if (d < now) return "finalizada";
  return "confirmada";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function parseLocation(loc: string | null): { sede: string; sala: string } {
  if (!loc) return { sede: "—", sala: "—" };
  const idx = loc.indexOf("-");
  if (idx === -1) return { sede: loc.trim() || "—", sala: "—" };
  return {
    sede: loc.slice(0, idx).trim() || "—",
    sala: loc.slice(idx + 1).trim() || "—",
  };
}

// ── ActionsMenu ───────────────────────────────────────────────────────────────
function ActionsMenu({
  open,
  onOpen,
  onClose,
  onCancel,
  cancelling,
  dropUp,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCancel: () => void;
  cancelling: boolean;
  dropUp: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onClose]);

  return (
    <div className="iv-actions" ref={wrapRef}>
      <button
        className="iv-actions-btn"
        aria-label="Acciones"
        disabled={cancelling}
        onClick={(e) => {
          e.stopPropagation();
          open ? onClose() : onOpen();
        }}
      >
        {cancelling
          ? <span className="iv-actions-spinner" />
          : <><span /><span /><span /></>
        }
      </button>

      {open && (
        <div className={`iv-actions-dropdown${dropUp ? " iv-actions-dropdown--up" : ""}`}>
          <button
            className="iv-actions-item iv-actions-item--danger"
            onClick={() => { onCancel(); onClose(); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Cancelar inscripción
          </button>
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function InscritasView({
  userId,
  searchQuery = "",
}: {
  userId: number;
  searchQuery?: string;
}) {
  const navigate = useNavigate();

  const [conferences, setConferences]   = useState<Conference[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [localSearch, setLocalSearch]   = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId]     = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { setLocalSearch(searchQuery); }, [searchQuery]);

  useEffect(() => {
    fetch(`${SEARCH_URL}/users/${userId}/conferences`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las conferencias");
        return res.json();
      })
      .then(setConferences)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Cancel inscription → DELETE /registrations/{registration_id} ───────────
  async function handleCancelInscription(conf: Conference) {
    if (cancellingId !== null) return;
    setCancellingId(conf.id);
    try {
      const res = await fetch(`${SEARCH_URL}/registrations/${conf.registration_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConferences((prev) => prev.filter((c) => c.id !== conf.id));
        showToast(`Inscripción a "${conf.title}" cancelada`, true);
      } else {
        const errMsg = await res
          .json()
          .then((d: { detail?: string }) => d.detail ?? "No se pudo cancelar la inscripción")
          .catch(() => "No se pudo cancelar la inscripción");
        showToast(errMsg, false);
      }
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setCancellingId(null);
    }
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const statuses = conferences.map((c) => getStatus(c.schedule));
    return {
      total:      conferences.length,
      confirmada: statuses.filter((s) => s === "confirmada").length,
      enCurso:    statuses.filter((s) => s === "en-curso").length,
      finalizada: statuses.filter((s) => s === "finalizada").length,
    };
  }, [conferences]);

  // Unique categories extracted dynamically — no hardcoded strings
  const categories = useMemo(() => (
    [...new Set(conferences.map((c) => c.category).filter((c): c is string => !!c))]
  ), [conferences]);

  // Sorted + filtered.
  // When selectedCategory is null AND search is active (global search),
  // the category filter is bypassed — results span all categories.
  const visible = useMemo(() => {
    const q = localSearch.toLowerCase();

    const filtered = conferences.filter((c) => {
      if (
        selectedCategory !== null &&
        selectedCategory !== "TODAS" &&
        c.category !== selectedCategory
      ) {
        return false;
      }
      return (
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.speaker_name  ?? "").toLowerCase().includes(q) ||
        (c.location_text ?? "").toLowerCase().includes(q) ||
        (c.category      ?? "").toLowerCase().includes(q)
      );
    });

    return [...filtered].sort(
      (a, b) => STATUS_PRIORITY[getStatus(a.schedule)] - STATUS_PRIORITY[getStatus(b.schedule)]
    );
  }, [conferences, localSearch, selectedCategory]);

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="iv-center">
      <div className="iv-spinner" />
      <p>Cargando tus conferencias…</p>
    </div>
  );

  if (error) return (
    <div className="iv-center iv-center--error">
      <span className="iv-icon">⚠</span>
      <p>{error}</p>
    </div>
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  if (conferences.length === 0) return (
    <div className="iv-center">
      <div className="iv-empty-art">
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true">
          <rect x="6" y="14" width="56" height="48" rx="7" fill="#e8f0fe"/>
          <rect x="6" y="14" width="56" height="20" rx="7" fill="#4361ee" opacity="0.15"/>
          <rect x="6" y="26" width="56" height="8" fill="#4361ee" opacity="0.1"/>
          <circle cx="21" cy="42" r="3.5" fill="#4361ee" opacity="0.35"/>
          <circle cx="34" cy="42" r="3.5" fill="#4361ee" opacity="0.35"/>
          <circle cx="47" cy="42" r="3.5" fill="#4361ee" opacity="0.35"/>
          <circle cx="21" cy="54" r="3.5" fill="#4361ee" opacity="0.25"/>
          <circle cx="34" cy="54" r="3.5" fill="#4361ee" opacity="0.25"/>
          <rect x="20" y="6" width="5" height="13" rx="2.5" fill="#4361ee"/>
          <rect x="43" y="6" width="5" height="13" rx="2.5" fill="#4361ee"/>
        </svg>
      </div>
      <h3 className="iv-empty-title">
        Aún no tienes conferencias inscritas en la CONIITI 2026
      </h3>
      <p className="iv-empty-sub">
        ¡Explora el cronograma e inscríbete a tus favoritas!
      </p>
      <button className="iv-empty-cta" onClick={() => navigate("/inscripciones")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Explorar conferencias
      </button>
    </div>
  );

  // Typing in the search while the category grid is visible triggers global search
  const isGlobalSearch = localSearch.length > 0 && selectedCategory === null;
  const showGrid       = !isGlobalSearch && selectedCategory === null;

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="iv-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`iv-toast iv-toast--${toast.ok ? "ok" : "err"}`}>
          {toast.ok ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="iv-kpi-row">
        <div className="iv-kpi-card">
          <div className="iv-kpi-icon iv-kpi-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="iv-kpi-label">Total inscritas</p>
            <p className="iv-kpi-value">{kpis.total}</p>
          </div>
        </div>

        <div className="iv-kpi-card">
          <div className="iv-kpi-icon iv-kpi-icon--green">
            <span className="iv-kpi-dot" />
          </div>
          <div>
            <p className="iv-kpi-label">Confirmadas</p>
            <p className="iv-kpi-value">{kpis.confirmada}</p>
          </div>
        </div>

        <div className="iv-kpi-card">
          <div className="iv-kpi-icon iv-kpi-icon--yellow">
            <span className="iv-kpi-dot" />
          </div>
          <div>
            <p className="iv-kpi-label">En curso</p>
            <p className="iv-kpi-value">{kpis.enCurso}</p>
          </div>
        </div>

        <div className="iv-kpi-card">
          <div className="iv-kpi-icon iv-kpi-icon--red">
            <span className="iv-kpi-dot" />
          </div>
          <div>
            <p className="iv-kpi-label">Finalizadas</p>
            <p className="iv-kpi-value">{kpis.finalizada}</p>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="iv-search-wrap">
        <svg className="iv-search-icon" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="iv-search"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setLocalSearch(""); }}
          placeholder="Buscar por conferencia, ponente, salón o categoría..."
        />
        {localSearch && (
          <button
            className="iv-search-clear"
            aria-label="Limpiar búsqueda"
            onClick={() => setLocalSearch("")}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Category cards grid ── */}
      {showGrid ? (
        <div className="iv-categories-grid">

          {/* Static "Mostrar Todas" — clears search to avoid cross-filter conflicts */}
          <button
            className="iv-cat-card iv-cat-card--all"
            onClick={() => { setSelectedCategory("TODAS"); setLocalSearch(""); }}
          >
            <div className="iv-cat-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <span className="iv-cat-card-label">Mostrar Todas</span>
            <span className="iv-cat-card-count">
              {conferences.length} conferencia{conferences.length !== 1 ? "s" : ""}
            </span>
          </button>

          {/* Dynamic cards — strings come directly from the DB */}
          {categories.map((cat) => {
            const count = conferences.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                className="iv-cat-card"
                onClick={() => setSelectedCategory(cat)}
              >
                <div className="iv-cat-card-icon iv-cat-card-icon--accent">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="iv-cat-card-label">{cat}</span>
                <span className="iv-cat-card-count">
                  {count} conferencia{count !== 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>

      ) : (
        /* ── Table area (category drill-down OR real-time global search) ── */
        <>
          {/* Back button shown only in explicit drill-down, not during global search */}
          {selectedCategory !== null && (
            <div className="iv-drill-header">
              <button
                className="iv-back-btn"
                onClick={() => { setSelectedCategory(null); setOpenMenuId(null); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Volver a Categorías
              </button>
              {selectedCategory !== "TODAS" && (
                <span className="iv-drill-label">{selectedCategory}</span>
              )}
            </div>
          )}

          {/* Global search: no results → centered message instead of empty table */}
          {isGlobalSearch && visible.length === 0 ? (
            <div className="iv-center iv-center--search">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: "#a0aec0" }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <h3 className="iv-empty-title">No se encontraron conferencias</h3>
              <p className="iv-empty-sub">
                que coincidan con "<strong>{localSearch}</strong>"
              </p>
            </div>
          ) : (
            <div className="iv-table-wrap">
              <table className="iv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Conferencia</th>
                    <th>Eje Temático</th>
                    <th>Estado</th>
                    <th>Ponente</th>
                    <th>Ubicación</th>
                    <th>Horario</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((conf, idx) => {
                    const status         = getStatus(conf.schedule);
                    const { sede, sala } = parseLocation(conf.location_text);
                    return (
                      <tr key={conf.id}>
                        <td className="iv-td-id">#{conf.registration_id}</td>

                        <td className="iv-td-title">{conf.title}</td>

                        <td>
                          {conf.category
                            ? <span className="iv-cat">{conf.category}</span>
                            : <span className="iv-muted">—</span>}
                        </td>

                        <td>
                          <span className={`iv-badge iv-badge--${status}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </td>

                        <td className="iv-td-speaker">
                          {conf.speaker_name ?? <span className="iv-muted">—</span>}
                        </td>

                        <td className="iv-td-location">
                          {conf.location_text ? (
                            <>
                              <span className="iv-loc-sede">{sede}</span>
                              {sala !== "—" && <span className="iv-loc-sala">{sala}</span>}
                            </>
                          ) : (
                            <span className="iv-muted">—</span>
                          )}
                        </td>

                        <td className="iv-td-time">
                          <span className="iv-time-date">{fmtDate(conf.schedule)}</span>
                          {conf.schedule && (
                            <span className="iv-time-hour">{fmtTime(conf.schedule)}</span>
                          )}
                        </td>

                        <td className="iv-td-actions">
                          <ActionsMenu
                            open={openMenuId === conf.id}
                            onOpen={() => setOpenMenuId(conf.id)}
                            onClose={() => setOpenMenuId(null)}
                            onCancel={() => handleCancelInscription(conf)}
                            cancelling={cancellingId === conf.id}
                            dropUp={idx >= visible.length - 2}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {visible.length === 0 && (
                <div className="iv-no-results">
                  {localSearch
                    ? <>Sin resultados para "<strong>{localSearch}</strong>"</>
                    : "No hay conferencias en esta categoría"}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
