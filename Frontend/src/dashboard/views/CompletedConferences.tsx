import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Award, Layers, ListFilter, ChevronDown } from "lucide-react";
import { SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./CompletedConferences.css";

interface CompletedConference {
  id_inscripcion:   number;
  title:            string;
  speaker_name:     string | null;
  schedule:         string | null;
  location_text:    string | null;
  fecha_validacion: string | null;
  category:         string | null;
}

const PAGE_SIZE = 8;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
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

  const [items, setItems]                       = useState<CompletedConference[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");
  const [search, setSearch]                     = useState("");
  const [page, setPage]                         = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder]               = useState<"newest" | "oldest">("newest");
  const [filterOpen, setFilterOpen]             = useState(false);
  const [downloading, setDownloading]           = useState<Set<number>>(new Set());
  const [certError, setCertError]               = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
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

  // ── Descarga de certificado ───────────────────────────────────────────────────
  const handleDownload = async (item: CompletedConference) => {
    const raw   = sessionStorage.getItem("session");
    const token = raw ? (JSON.parse(raw) as { token?: string }).token : null;
    if (!token) { setCertError("Sesión expirada. Vuelve a iniciar sesión."); return; }

    setDownloading(prev => new Set(prev).add(item.id_inscripcion));
    setCertError("");
    try {
      const res = await fetch(
        `${SEARCH_URL}/certificados/descargar/${item.id_inscripcion}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? "Error al generar el certificado");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `certificado_${item.title.replace(/\s+/g, "_").slice(0, 40)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "No se pudo descargar el certificado");
    } finally {
      setDownloading(prev => {
        const next = new Set(prev);
        next.delete(item.id_inscripcion);
        return next;
      });
    }
  };

  // ── Close category dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    if (!filterOpen) return;
    function onDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const categories = useMemo(() =>
    [...new Set(items.map(c => c.category).filter((c): c is string => !!c))].sort(),
    [items]
  );

  // Paso 1 → texto · Paso 2 → categoría · Paso 3 → orden cronológico
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = q
      ? items.filter(c =>
          c.title.toLowerCase().includes(q) ||
          (c.speaker_name ?? "").toLowerCase().includes(q)
        )
      : [...items];

    if (selectedCategory) {
      result = result.filter(c => c.category === selectedCategory);
    }

    result.sort((a, b) => {
      const da = a.schedule ? new Date(a.schedule).getTime() : 0;
      const db = b.schedule ? new Date(b.schedule).getTime() : 0;
      return sortOrder === "newest" ? db - da : da - db;
    });

    return result;
  }, [items, search, selectedCategory, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const paginated  = filtered.slice(start, start + PAGE_SIZE);

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

        {/* ── Error de certificado ── */}
        {certError && (
          <div className="ccv-cert-error" role="alert">
            <span>⚠ {certError}</span>
            <button className="ccv-cert-error-close" onClick={() => setCertError("")}>✕</button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="ccv-card-header">
          <h2 className="ccv-heading">{t.ccv_heading}</h2>

          <div className="ccv-controls">

            {/* Search */}
            <div className="ccv-search-wrap">
              <Search size={14} strokeWidth={2.2} className="ccv-search-icon" />
              <input
                className="ccv-search-input"
                type="text"
                placeholder={t.ccv_search_ph}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* ── Category filter button ── */}
            {categories.length > 0 && (
              <div className="ccv-filter-wrap" ref={filterRef}>
                <button
                  className={[
                    "ccv-ctrl-btn",
                    filterOpen       ? "ccv-ctrl-btn--open"   : "",
                    selectedCategory ? "ccv-ctrl-btn--active" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setFilterOpen(o => !o)}
                >
                  <Layers size={13} strokeWidth={2} />
                  <span>{selectedCategory ?? t.ccv_filter_all}</span>
                  <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    className={`ccv-filter-chevron${filterOpen ? " ccv-filter-chevron--open" : ""}`}
                  />
                </button>

                {filterOpen && (
                  <div className="ccv-filter-dropdown">
                    <button
                      className={`ccv-filter-option${!selectedCategory ? " ccv-filter-option--active" : ""}`}
                      onClick={() => { setSelectedCategory(null); setFilterOpen(false); setPage(1); }}
                    >
                      {t.ccv_filter_all}
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`ccv-filter-option${selectedCategory === cat ? " ccv-filter-option--active" : ""}`}
                        onClick={() => { setSelectedCategory(cat); setFilterOpen(false); setPage(1); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Sort toggle button ── */}
            <button
              className={`ccv-ctrl-btn ccv-sort-btn${sortOrder === "oldest" ? " ccv-ctrl-btn--active" : ""}`}
              onClick={() => {
                setSortOrder(o => o === "newest" ? "oldest" : "newest");
                setPage(1);
              }}
              title={sortOrder === "newest" ? t.ccv_sort_newest : t.ccv_sort_oldest}
            >
              <ListFilter size={14} strokeWidth={2} />
              <span>{sortOrder === "newest" ? t.ccv_sort_newest : t.ccv_sort_oldest}</span>
            </button>

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
                        disabled={downloading.has(item.id_inscripcion)}
                        onClick={() => handleDownload(item)}
                      >
                        {downloading.has(item.id_inscripcion)
                          ? <span className="ccv-btn-spinner" aria-hidden="true" />
                          : <Award size={13} strokeWidth={2} />
                        }
                        {downloading.has(item.id_inscripcion)
                          ? (t.ccv_cert_downloading ?? "Generando...")
                          : t.ccv_cert_btn
                        }
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


      </div>

      {/* ── Paginación externa — solo visible cuando hay más de una página ── */}
      {totalPages > 1 && (
        <div className="ccv-pagination-ext">
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
      )}

    </div>
  );
}
