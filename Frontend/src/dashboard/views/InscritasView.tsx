import { useState, useEffect, useMemo, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CircleCheck, Clock, Flag } from "lucide-react";
import { SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./InscritasView.css";

import type { Conference } from "../../interfaces/conference";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "confirmada" | "en-curso" | "finalizada";

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
const ActionsMenu = memo(function ActionsMenu({
  open,
  onOpen,
  onClose,
  onCancel,
  cancelling,
  dropUp,
  cancelLabel,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCancel: () => void;
  cancelling: boolean;
  dropUp: boolean;
  cancelLabel: string;
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
            {cancelLabel}
          </button>
        </div>
      )}
    </div>
  );
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function InscritasView({
  userId,
  searchQuery = "",
}: {
  userId: number;
  searchQuery?: string;
}) {
  const { t } = useLang();
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
        if (!res.ok) throw new Error(t.iv_load_error);
        return res.json();
      })
      .then(setConferences)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Status labels (reactive) ───────────────────────────────────────────────
  const statusLabel: Record<Status, string> = {
    "confirmada": t.iv_status_confirmed,
    "en-curso":   t.iv_status_ongoing,
    "finalizada": t.iv_status_finished,
  };

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Cancel inscription ─────────────────────────────────────────────────────
  async function handleCancelInscription(conf: Conference) {
    if (cancellingId !== null) return;
    setCancellingId(conf.id);
    try {
      const res = await fetch(`${SEARCH_URL}/registrations/${conf.registration_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConferences((prev) => prev.filter((c) => c.id !== conf.id));
        showToast(t.iv_cancel_ok.replace("{0}", conf.title), true);
      } else {
        const errMsg = await res
          .json()
          .then((d: { detail?: string }) => d.detail ?? t.iv_cancel_fail)
          .catch(() => t.iv_cancel_fail);
        showToast(errMsg, false);
      }
    } catch {
      showToast(t.iv_conn_error, false);
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

  const categories = useMemo(() => (
    [...new Set(conferences.map((c) => c.category).filter((c): c is string => !!c))]
  ), [conferences]);

  const visible = useMemo(() => {
    const q = localSearch.toLowerCase();
    const filtered = conferences.filter((c) => {
      if (
        selectedCategory !== null &&
        selectedCategory !== "TODAS" &&
        c.category !== selectedCategory
      ) return false;
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
      <p>{t.iv_loading}</p>
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
      <h3 className="iv-empty-title">{t.iv_empty_title}</h3>
      <p className="iv-empty-sub">{t.iv_empty_sub}</p>
      <button className="iv-empty-cta" onClick={() => navigate("/inscripciones")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        {t.iv_explore}
      </button>
    </div>
  );

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

      {/* ══════════════════════════════════════════════════════════════
          OPCIÓN A — Layout de dos columnas (ACTIVO)
          Columna izquierda: búsqueda + filtros + tabla
          Columna derecha:   widget estadístico sticky
         ══════════════════════════════════════════════════════════════ */}
      <div className="iv-layout">

        {/* ── Columna principal (3fr) ── */}
        <div className="iv-layout__main">

          {/* Búsqueda */}
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
              placeholder={t.iv_search_ph}
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

          {/* Categorías o tabla */}
          {showGrid ? (
            <div className="iv-categories-grid">

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
                <span className="iv-cat-card-label">{t.iv_show_all}</span>
                <span className="iv-cat-card-count">
                  {conferences.length} {conferences.length !== 1 ? t.iv_conference_pl : t.iv_conference_s}
                </span>
              </button>

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
                      {count} {count !== 1 ? t.iv_conference_pl : t.iv_conference_s}
                    </span>
                  </button>
                );
              })}
            </div>

          ) : (
            <>
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
                    {t.iv_back_cats}
                  </button>
                  {selectedCategory !== "TODAS" && (
                    <span className="iv-drill-label">{selectedCategory}</span>
                  )}
                </div>
              )}

              {isGlobalSearch && visible.length === 0 ? (
                <div className="iv-center iv-center--search">
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: "#a0aec0" }}>
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <h3 className="iv-empty-title">{t.iv_no_results}</h3>
                  <p className="iv-empty-sub">
                    {t.iv_matching} "<strong>{localSearch}</strong>"
                  </p>
                </div>
              ) : (
                <div className="iv-table-wrap">
                  <table className="iv-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t.iv_th_conference}</th>
                        <th>{t.iv_th_category}</th>
                        <th>{t.iv_th_status}</th>
                        <th>{t.iv_th_speaker}</th>
                        <th>{t.iv_th_location}</th>
                        <th>{t.iv_th_schedule}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((conf, rowIdx) => {
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
                                {statusLabel[status]}
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
                                dropUp={rowIdx >= visible.length - 2}
                                cancelLabel={t.iv_cancel_action}
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
                        ? <>{t.iv_no_results_q} "<strong>{localSearch}</strong>"</>
                        : t.iv_no_results_cat}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>{/* fin iv-layout__main */}

        {/* ── Columna lateral derecha: widget de estadísticas (1fr) ── */}
        <aside className="iv-stats-widget">

          <div className="iv-stat-item">
            <CalendarDays size={22} strokeWidth={1.75} className="iv-stat-icon iv-stat-icon--blue" />
            <div className="iv-stat-info">
              <span className="iv-stat-value">{kpis.total}</span>
              <span className="iv-stat-label">{t.iv_kpi_total}</span>
            </div>
          </div>

          <div className="iv-stat-item">
            <CircleCheck size={22} strokeWidth={1.75} className="iv-stat-icon iv-stat-icon--green" />
            <div className="iv-stat-info">
              <span className="iv-stat-value">{kpis.confirmada}</span>
              <span className="iv-stat-label">{t.iv_kpi_confirmed}</span>
            </div>
          </div>

          <div className="iv-stat-item">
            <Clock size={22} strokeWidth={1.75} className="iv-stat-icon iv-stat-icon--yellow" />
            <div className="iv-stat-info">
              <span className="iv-stat-value">{kpis.enCurso}</span>
              <span className="iv-stat-label">{t.iv_kpi_ongoing}</span>
            </div>
          </div>

          <div className="iv-stat-item">
            <Flag size={22} strokeWidth={1.75} className="iv-stat-icon iv-stat-icon--red" />
            <div className="iv-stat-info">
              <span className="iv-stat-value">{kpis.finalizada}</span>
              <span className="iv-stat-label">{t.iv_kpi_finished}</span>
            </div>
          </div>

        </aside>

      </div>{/* fin iv-layout */}

      {/*
        ══════════════════════════════════════════════════════════════
        OPCIÓN B — Fila de resumen compacta al final (COMENTADA)
        Para activar: descomenta este bloque y elimina iv-layout arriba.
        ══════════════════════════════════════════════════════════════

      <div className="iv-kpi-footer">
        <div className="iv-kpi-mini">
          <CalendarDays size={20} strokeWidth={1.75} className="iv-kpi-mini-icon iv-kpi-mini-icon--blue" />
          <div className="iv-kpi-mini-info">
            <span className="iv-kpi-mini-value">{kpis.total}</span>
            <span className="iv-kpi-mini-label">{t.iv_kpi_total}</span>
          </div>
        </div>
        <div className="iv-kpi-mini">
          <CircleCheck size={20} strokeWidth={1.75} className="iv-kpi-mini-icon iv-kpi-mini-icon--green" />
          <div className="iv-kpi-mini-info">
            <span className="iv-kpi-mini-value">{kpis.confirmada}</span>
            <span className="iv-kpi-mini-label">{t.iv_kpi_confirmed}</span>
          </div>
        </div>
        <div className="iv-kpi-mini">
          <Clock size={20} strokeWidth={1.75} className="iv-kpi-mini-icon iv-kpi-mini-icon--yellow" />
          <div className="iv-kpi-mini-info">
            <span className="iv-kpi-mini-value">{kpis.enCurso}</span>
            <span className="iv-kpi-mini-label">{t.iv_kpi_ongoing}</span>
          </div>
        </div>
        <div className="iv-kpi-mini">
          <Flag size={20} strokeWidth={1.75} className="iv-kpi-mini-icon iv-kpi-mini-icon--red" />
          <div className="iv-kpi-mini-info">
            <span className="iv-kpi-mini-value">{kpis.finalizada}</span>
            <span className="iv-kpi-mini-label">{t.iv_kpi_finished}</span>
          </div>
        </div>
      </div>

      */}

    </div>
  );
}
