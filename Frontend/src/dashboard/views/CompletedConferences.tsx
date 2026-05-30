import { useState, useEffect, useMemo } from "react";
import { Search, Award } from "lucide-react";
import { SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./CompletedConferences.css";

interface CompletedConference {
  id_inscripcion: number;
  title: string;
  speaker_name: string | null;
  schedule: string | null;
  location_text: string | null;
  fecha_validacion: string | null;
}

const PAGE_SIZE = 8;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPagesToShow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export default function CompletedConferences({ userId }: { userId: number }) {
  const { t } = useLang();

  const [items, setItems]     = useState<CompletedConference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${SEARCH_URL}/conferences/completed?user_id=${userId}`, { signal: ctrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(t.ccv_load_error ?? "Error al cargar");
        return res.json() as Promise<CompletedConference[]>;
      })
      .then(setItems)
      .catch((err: Error) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.speaker_name ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const paginated  = filtered.slice(start, start + PAGE_SIZE);

  function onSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="ccv-center">
      <div className="ccv-spinner" />
      <p className="ccv-center-msg">{t.ccv_loading}</p>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="ccv-center ccv-center--error">
      <span className="ccv-center-icon">⚠</span>
      <p className="ccv-center-msg">{error}</p>
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (items.length === 0) return (
    <div className="ccv-center">
      <div className="ccv-empty-art">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <rect x="10" y="6" width="44" height="52" rx="6" fill="#e8f0fe"/>
          <rect x="10" y="6" width="44" height="18" rx="6" fill="#4361ee" opacity="0.12"/>
          <rect x="10" y="16" width="44" height="8" fill="#4361ee" opacity="0.08"/>
          <rect x="18" y="32" width="28" height="3" rx="1.5" fill="#4361ee" opacity="0.25"/>
          <rect x="18" y="40" width="20" height="3" rx="1.5" fill="#4361ee" opacity="0.2"/>
          <rect x="18" y="48" width="14" height="3" rx="1.5" fill="#4361ee" opacity="0.15"/>
          <circle cx="56" cy="54" r="15" fill="#e0f2fe"/>
          <circle cx="56" cy="54" r="11" fill="#bae6fd"/>
          <path d="M50 54 L54.5 58.5 L63 49" stroke="#0369a1" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className="ccv-empty-title">{t.ccv_empty_title}</h3>
      <p className="ccv-empty-sub">{t.ccv_empty_sub}</p>
    </div>
  );

  const pages = getPagesToShow(safePage, totalPages);

  // ── Main view ─────────────────────────────────────────────────────────────────
  return (
    <div className="ccv-page">
      <div className="ccv-card">

        {/* ── Header ── */}
        <div className="ccv-card-header">
          <h2 className="ccv-heading">{t.ccv_heading}</h2>
          <div className="ccv-search-wrap">
            <Search size={14} strokeWidth={2.2} className="ccv-search-icon" />
            <input
              className="ccv-search-input"
              type="text"
              placeholder={t.ccv_search_ph}
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ccv-table-wrap">
          <table className="ccv-table">
            <thead>
              <tr>
                <th>{t.ccv_th_conference}</th>
                <th>{t.ccv_th_speaker}</th>
                <th>{t.ccv_th_location}</th>
                <th>{t.ccv_th_date}</th>
                <th>{t.ccv_th_action}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map(item => (
                  <tr key={item.id_inscripcion}>
                    <td className="ccv-td-title">{item.title}</td>
                    <td className="ccv-td-speaker">
                      {item.speaker_name ?? <span className="ccv-muted">—</span>}
                    </td>
                    <td className="ccv-td-location">
                      {item.location_text ?? <span className="ccv-muted">—</span>}
                    </td>
                    <td className="ccv-td-date">{fmtDate(item.schedule)}</td>
                    <td className="ccv-td-action">
                      <button
                        className="ccv-cert-btn"
                        onClick={() =>
                          console.log(
                            "Generando certificado para la conferencia ID:",
                            item.id_inscripcion
                          )
                        }
                      >
                        <Award size={13} strokeWidth={2} />
                        {t.ccv_cert_btn}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="ccv-no-results">
                    {t.ccv_no_results}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="ccv-pagination">
          <span className="ccv-pag-info">
            {t.ccv_showing}
            {filtered.length > 0 && (
              <>&nbsp;{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)}&nbsp;de&nbsp;{filtered.length}</>
            )}
          </span>
          <div className="ccv-pag-controls">
            <button
              className="ccv-pag-btn ccv-pag-btn--arrow"
              disabled={safePage === 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Página anterior"
            >‹</button>
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`el-${i}`} className="ccv-pag-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`ccv-pag-btn${p === safePage ? " ccv-pag-btn--active" : ""}`}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="ccv-pag-btn ccv-pag-btn--arrow"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Página siguiente"
            >›</button>
          </div>
        </div>

      </div>
    </div>
  );
}
