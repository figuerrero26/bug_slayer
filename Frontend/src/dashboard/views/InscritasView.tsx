import { useState, useEffect, useMemo } from "react";
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function InscritasView({
  userId,
  searchQuery = "",
}: {
  userId: number;
  searchQuery?: string;
}) {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [localSearch, setLocalSearch] = useState(searchQuery);

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

  const kpis = useMemo(() => {
    const statuses = conferences.map((c) => getStatus(c.schedule));
    return {
      total:      conferences.length,
      confirmada: statuses.filter((s) => s === "confirmada").length,
      enCurso:    statuses.filter((s) => s === "en-curso").length,
      finalizada: statuses.filter((s) => s === "finalizada").length,
    };
  }, [conferences]);

  const visible = useMemo(() => {
    const q = localSearch.toLowerCase();
    return conferences.filter(
      (c) =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.speaker_name   ?? "").toLowerCase().includes(q) ||
        (c.location_text  ?? "").toLowerCase().includes(q),
    );
  }, [conferences, localSearch]);

  // ── Loading / Error / Empty ────────────────────────────────────────────────
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

  if (conferences.length === 0) return (
    <div className="iv-center">
      <span className="iv-icon">📭</span>
      <h3 className="iv-empty-title">Sin conferencias inscritas</h3>
      <p className="iv-empty-sub">
        Explora el catálogo y regístrate en las que más te interesen.
      </p>
    </div>
  );

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="iv-page">

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
          placeholder="Buscar por conferencia, ponente o salón..."
        />
      </div>

      {/* ── Table ── */}
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
            </tr>
          </thead>
          <tbody>
            {visible.map((conf) => {
              const status        = getStatus(conf.schedule);
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
                </tr>
              );
            })}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="iv-no-results">
            Sin resultados para "<strong>{localSearch}</strong>"
          </div>
        )}
      </div>

    </div>
  );
}
