import { useEffect, useState, useMemo, useRef } from "react";
import {
  ArrowLeft, CheckCheck, SlidersHorizontal, Search, ChevronDown,
  AlertCircle, Bell, CheckCircle2,
  User, Calendar, MapPin, QrCode,
} from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { NOTIFICATIONS_URL, SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./MessagesView.css";

registerLocale("es", es);

import type { Notification } from "../../interfaces/notification";
import type { Conference }   from "../../interfaces/conference";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConferenceDetails {
  id: number;
  title: string;
  speaker_name: string | null;
  category: string | null;
  schedule: string | null;
  campus_name: string | null;
  room_name: string | null;
}

type Tab        = "all" | "unread";
type QuickRange = "" | "today" | "week";

// ── Helpers ───────────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: string }) {
  if (type === "alerta")
    return <AlertCircle size={22} strokeWidth={1.8} className="msv-type-icon msv-type-icon--warn" />;
  if (type === "sistema")
    return <Bell size={22} strokeWidth={1.8} className="msv-type-icon msv-type-icon--neutral" />;
  return <CheckCircle2 size={22} strokeWidth={1.8} className="msv-type-icon msv-type-icon--info" />;
}

function extractConference(message: string, conferences: Conference[]): Conference | null {
  const upper = message.toUpperCase();
  return conferences.find((c) => c.title && upper.includes(c.title.toUpperCase())) ?? null;
}

// Fuerza interpretación UTC en strings sin indicador de zona (backend envía naive datetimes)
function parseUTC(iso: string): Date {
  return new Date(/Z|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`);
}

function formatSchedule(raw: string): string {
  const d = parseUTC(raw);
  if (isNaN(d.getTime())) return raw;
  const weekday = d.toLocaleDateString("es-CO", { weekday: "long" });
  const date    = d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  const time    = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${date} | ${time}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const date = parseUTC(iso);
  const now  = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function fullDateTime(iso: string | null): string {
  if (!iso) return "—";
  return parseUTC(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function toDay(iso: string | null): number {
  if (!iso) return NaN;
  const d = parseUTC(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── ThemeSelect — dropdown personalizado ──────────────────────────────────────

interface SelectOption { value: string; label: string; }

function ThemeSelect({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="msv-theme-select" ref={ref}>
      <button
        type="button"
        className={`msv-theme-trigger${open ? " msv-theme-trigger--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "msv-theme-trigger-value" : "msv-theme-trigger-placeholder"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={2.2} className="msv-theme-chevron" />
      </button>

      {open && (
        <div className="msv-theme-menu">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`msv-theme-option${value === o.value ? " msv-theme-option--active" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId: number;
  onUnreadChange: (count: number) => void;
  searchQuery?: string;
}

export default function MessagesView({ userId, onUnreadChange, searchQuery = "" }: Props) {
  const { t } = useLang();

  // ── Core data ──────────────────────────────────────────────────────────────
  const [items, setItems]             = useState<Notification[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>("all");
  const [selected, setSelected]       = useState<Notification | null>(null);
  const [conference, setConference]   = useState<ConferenceDetails | null>(null);
  const [loadingConf, setLoadingConf] = useState(false);
  const [conferences, setConferences] = useState<Conference[]>([]);

  // ── Global search bar (reactivo) ───────────────────────────────────────────
  const [keyword, setKeyword] = useState("");

  // ── Panel: estado borrador (no filtra hasta "Aplicar") ─────────────────────
  const [showAdvanced, setShowAdvanced]       = useState(false);
  const [draftQuickRange, setDraftQuickRange] = useState<QuickRange>("");
  const [draftDateFrom, setDraftDateFrom]     = useState<Date | null>(null);
  const [draftDateTo, setDraftDateTo]         = useState<Date | null>(null);
  const [draftTheme, setDraftTheme]           = useState("");

  // ── Estado aplicado (lo que realmente filtra la lista) ─────────────────────
  const [appliedQuickRange, setAppliedQuickRange] = useState<QuickRange>("");
  const [appliedDateFrom, setAppliedDateFrom]     = useState<Date | null>(null);
  const [appliedDateTo, setAppliedDateTo]         = useState<Date | null>(null);
  const [appliedTheme, setAppliedTheme]           = useState("");

  // ── API fetches ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${NOTIFICATIONS_URL}/notifications/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Notification[]>;
      })
      .then((data) => {
        setItems(data);
        onUnreadChange(data.filter((n) => !n.is_read).length);
      })
      .catch(() => setError(t.msv_error))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetch(`${SEARCH_URL}/conferences`)
      .then((r) => r.ok ? r.json() as Promise<Conference[]> : Promise.reject())
      .then(setConferences)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected?.conference_id) { setConference(null); return; }
    setLoadingConf(true);
    setConference(null);
    fetch(`${SEARCH_URL}/conferences/${selected.conference_id}`)
      .then((r) => r.ok ? r.json() as Promise<ConferenceDetails> : Promise.reject())
      .then(setConference)
      .catch(() => setConference(null))
      .finally(() => setLoadingConf(false));
  }, [selected?.conference_id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markRead = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    onUnreadChange(items.filter((n) => !n.is_read && n.id !== id).length);
    fetch(`${NOTIFICATIONS_URL}/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  };

  const markAllRead = () => {
    const unread = items.filter((n) => !n.is_read);
    if (!unread.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onUnreadChange(0);
    unread.forEach((n) =>
      fetch(`${NOTIFICATIONS_URL}/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {})
    );
  };

  const openNotif = (n: Notification) => { setSelected(n); if (!n.is_read) markRead(n.id); };
  const goBack    = () => { setSelected(null); setConference(null); };
  const markUnread = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    onUnreadChange(items.filter((n) => !n.is_read).length + 1);
  };

  // Consolida borrador → aplicado y cierra el panel
  const applyFilters = () => {
    setAppliedQuickRange(draftQuickRange);
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    setAppliedTheme(draftTheme);
    setShowAdvanced(false);
  };

  // Limpia todo: borrador, aplicado y barra global
  const clearFilters = () => {
    setDraftQuickRange(""); setDraftDateFrom(null); setDraftDateTo(null); setDraftTheme("");
    setAppliedQuickRange(""); setAppliedDateFrom(null); setAppliedDateTo(null); setAppliedTheme("");
    setKeyword("");
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  // Fecha de hoy — límite máximo del calendario
  const today = useMemo(() => new Date(), []);

  // Fecha del mensaje más antiguo — límite mínimo del calendario
  const minDate = useMemo(() => {
    if (!items.length) return undefined;
    const oldest = items.reduce((a, b) => {
      if (!a.created_at) return b;
      if (!b.created_at) return a;
      return new Date(a.created_at) < new Date(b.created_at) ? a : b;
    });
    return oldest.created_at ? new Date(oldest.created_at) : undefined;
  }, [items]);

  const hasActiveFilters =
    appliedQuickRange !== "" || appliedDateFrom !== null || appliedDateTo !== null
    || appliedTheme !== "" || keyword.trim() !== "";

  // ── Filtro compuesto — usa estado APLICADO + keyword reactivo ──────────────
  const visible = useMemo(() => {
    const q  = searchQuery.toLowerCase();
    const kw = keyword.trim().toLowerCase();

    const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
    const cutMs: number | null =
      appliedQuickRange === "today" ? todayStart :
      appliedQuickRange === "week"  ? todayStart - 6 * 24 * 60 * 60 * 1000 :
      null;
    const fromMs = appliedDateFrom
      ? (() => { const d = new Date(appliedDateFrom); d.setHours(0,0,0,0); return d.getTime(); })()
      : null;
    const toMs = appliedDateTo
      ? (() => { const d = new Date(appliedDateTo); d.setHours(0,0,0,0); return d.getTime(); })()
      : null;


    return items.filter((n) => {
      if (tab === "unread" && n.is_read) return false;

      // Barra global del dashboard
      if (q && !n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q))
        return false;

      // Barra de búsqueda interna (reactiva)
      if (kw && !n.title.toLowerCase().includes(kw) && !n.message.toLowerCase().includes(kw))
        return false;

      // Línea temática (aplicada)
      if (appliedTheme) {
        const conf     = extractConference(n.message, conferences);
        const catValue = t[appliedTheme] ?? appliedTheme;
        if (!conf?.category || !conf.category.toLowerCase().includes(catValue.toLowerCase()))
          return false;
      }

      // Fecha (normalizada a inicio de día)
      const notifDay = toDay(n.created_at);
      if (!isNaN(notifDay)) {
        if (cutMs !== null && notifDay < cutMs) return false;
        if (cutMs === null) {
          if (fromMs !== null && notifDay < fromMs) return false;
          if (toMs   !== null && notifDay > toMs)   return false;
        }
      }

      return true;
    });
  }, [items, tab, searchQuery, keyword, appliedQuickRange, appliedDateFrom, appliedDateTo, appliedTheme, conferences, t]);

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="msv-center">
        <div className="msv-spinner" />
        <p className="msv-hint">{t.msv_loading}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="msv-center">
        <p className="msv-hint">{error}</p>
      </div>
    );
  }

  // ── View B: Message detail ─────────────────────────────────────────────────
  if (selected) {
    const matched = extractConference(selected.message, conferences);
    return (
      <div className="msv-wrapper">
        <div className="msv-toolbar">
          <button className="msv-back-btn" onClick={goBack}>
            <ArrowLeft size={17} strokeWidth={2} />
            <span>{t.msv_back_inbox}</span>
          </button>
        </div>
        <div className="msv-subject-row">
          <h2 className="msv-subject">{selected.title}</h2>
        </div>
        <div className="msv-sender-row">
          <div className="msv-type-icon-wrap"><TypeIcon type={selected.type} /></div>
          <div className="msv-sender-info">
            <span className="msv-sender-name">{selected.title}</span>
          </div>
          <div className="msv-sender-controls">
            <span className="msv-full-date">{fullDateTime(selected.created_at)}</span>
          </div>
        </div>
        <div className="msv-mail-body">
          <p className="msv-body-text">{selected.message}</p>
        </div>
        {matched && (
          <div className="msv-conf-card">
            <p className="msv-conf-card-title">{matched.title}</p>
            <div className="msv-conf-card-grid">
              <div className="msv-conf-card-col">
                {matched.speaker_name && (
                  <div className="msv-conf-card-row">
                    <User size={16} strokeWidth={1.8} className="msv-conf-card-icon" />
                    <span>{matched.speaker_name}</span>
                  </div>
                )}
                {(matched.campus_name || matched.room_name) && (
                  <div className="msv-conf-card-row">
                    <MapPin size={16} strokeWidth={1.8} className="msv-conf-card-icon" />
                    <div className="msv-conf-card-location">
                      <span className="msv-conf-card-campus">
                        {matched.campus_name ?? t.prof_ticket_venue}
                      </span>
                      {matched.room_name && (
                        <span className="msv-conf-card-room">{matched.room_name}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="msv-conf-card-col">
                {matched.schedule && (
                  <div className="msv-conf-card-row">
                    <Calendar size={16} strokeWidth={1.8} className="msv-conf-card-icon" />
                    <span>{formatSchedule(matched.schedule)}</span>
                  </div>
                )}
                {matched.category && (
                  <div className="msv-conf-card-row">
                    <span className="msv-conf-card-cat">{matched.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {selected.conference_id && (
          loadingConf ? (
            <div className="msv-skeleton-wrap">
              <div className="msv-skeleton msv-skeleton--heading" />
              <div className="msv-skeleton msv-skeleton--line" />
              <div className="msv-skeleton msv-skeleton--line msv-skeleton--short" />
            </div>
          ) : conference ? (
            <div className="msv-ticket">
              <div className="msv-ticket-main">
                <p className="msv-ticket-eyebrow">{t.msv_ticket_label}</p>
                <h3 className="msv-ticket-title">{conference.title.toUpperCase()}</h3>
                <div className="msv-ticket-details">
                  {conference.speaker_name && (
                    <div className="msv-ticket-row">
                      <User size={13} strokeWidth={2} className="msv-ti" />
                      <span>{conference.speaker_name}</span>
                    </div>
                  )}
                  {conference.schedule && (
                    <div className="msv-ticket-row">
                      <Calendar size={13} strokeWidth={2} className="msv-ti" />
                      <span>{conference.schedule}</span>
                    </div>
                  )}
                  {conference.campus_name && (
                    <div className="msv-ticket-row">
                      <MapPin size={13} strokeWidth={2} className="msv-ti" />
                      <span>{conference.campus_name}{conference.room_name ? ` · ${conference.room_name}` : ""}</span>
                    </div>
                  )}
                  {conference.category && (
                    <span className="msv-ticket-cat">{conference.category}</span>
                  )}
                </div>
              </div>
              <div className="msv-ticket-stub">
                <QrCode size={46} strokeWidth={1.4} className="msv-qr" />
                <span className="msv-ticket-id">#{String(conference.id).padStart(5, "0")}</span>
                <span className="msv-ticket-access">{t.msv_ticket_access}</span>
              </div>
            </div>
          ) : null
        )}
        <div className="msv-mail-actions">
          <button className="msv-action-btn" onClick={() => { markUnread(selected.id); goBack(); }}>
            {t.msv_mark_unread}
          </button>
        </div>
      </div>
    );
  }

  // ── View A: Inbox ──────────────────────────────────────────────────────────
  return (
    <div className="msv-wrapper">

      {/* Header */}
      <div className="msv-header">
        <h2 className="msv-heading">{t.msv_center_title}</h2>
        <div className="msv-header-actions">
          <button
            className={`msv-adv-toggle${showAdvanced || hasActiveFilters ? " msv-adv-toggle--active" : ""}`}
            onClick={() => setShowAdvanced((v) => !v)}
            title={t.msv_adv_search}
          >
            <SlidersHorizontal size={14} strokeWidth={2.2} />
            <span>{t.msv_adv_search}</span>
            {hasActiveFilters && <span className="msv-adv-dot" />}
          </button>
          <button className="msv-btn-mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={14} strokeWidth={2.4} />
            {t.msv_mark_all_read}
          </button>
        </div>
      </div>

      {/* Barra de búsqueda global — entre título y tabs */}
      <div className="msv-search-wrap">
        <Search size={15} strokeWidth={2} className="msv-search-icon" />
        <input
          type="text"
          className="msv-global-search"
          placeholder={t.msv_adv_keyword_ph}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        {keyword && (
          <button className="msv-search-clear" onClick={() => setKeyword("")} aria-label="Limpiar">
            ×
          </button>
        )}
      </div>

      {/* Panel de búsqueda avanzada */}
      <div className={`msv-adv-panel${showAdvanced ? " msv-adv-panel--open" : ""}`}>
        <div className="msv-adv-inner">

          {/* Rango de fechas */}
          <div className="msv-adv-section">
            <span className="msv-adv-label">{t.msv_adv_date_range}</span>
            <div className="msv-adv-quick-btns">
              {(["today", "week"] as QuickRange[]).map((r) => (
                <button
                  key={r}
                  className={`msv-adv-quick-btn${draftQuickRange === r ? " msv-adv-quick-btn--active" : ""}`}
                  onClick={() => {
                    setDraftQuickRange(draftQuickRange === r ? "" : r);
                    setDraftDateFrom(null); setDraftDateTo(null);
                  }}
                >
                  {r === "today" ? t.msv_adv_today : t.msv_adv_week}
                </button>
              ))}
            </div>
            <div className="msv-adv-dates">
              <div className="msv-adv-date-field">
                <label className="msv-adv-date-label">{t.msv_adv_from}</label>
                <DatePicker
                  locale="es"
                  selected={draftDateFrom}
                  onChange={(d: Date | null) => { setDraftDateFrom(d); setDraftQuickRange(""); }}
                  selectsStart
                  startDate={draftDateFrom}
                  endDate={draftDateTo}
                  minDate={minDate}
                  maxDate={today}
                  placeholderText="dd/mm/aaaa"
                  dateFormat="dd/MM/yyyy"
                  className="msv-dp-input"
                  calendarClassName="msv-dp-calendar"
                  wrapperClassName="msv-dp-wrapper"
                />
              </div>
              <div className="msv-adv-date-field">
                <label className="msv-adv-date-label">{t.msv_adv_to}</label>
                <DatePicker
                  locale="es"
                  selected={draftDateTo}
                  onChange={(d: Date | null) => { setDraftDateTo(d); setDraftQuickRange(""); }}
                  selectsEnd
                  startDate={draftDateFrom}
                  endDate={draftDateTo}
                  minDate={draftDateFrom ?? minDate}
                  maxDate={today}
                  placeholderText="dd/mm/aaaa"
                  dateFormat="dd/MM/yyyy"
                  className="msv-dp-input"
                  calendarClassName="msv-dp-calendar"
                  wrapperClassName="msv-dp-wrapper"
                />
              </div>
            </div>
          </div>

          {/* Línea temática */}
          <div className="msv-adv-section">
            <span className="msv-adv-label">{t.msv_adv_theme}</span>
            <ThemeSelect
              value={draftTheme}
              onChange={setDraftTheme}
              placeholder={t.msv_adv_theme_all}
              options={[
                { value: "",             label: t.msv_adv_theme_all },
                { value: "cat_software", label: t.cat_software      },
                { value: "cat_ai",       label: t.cat_ai            },
                { value: "cat_cities",   label: t.cat_cities        },
                { value: "cat_security", label: t.cat_security      },
                { value: "cat_tech",     label: t.cat_tech          },
              ]}
            />
          </div>

          {/* Footer del panel */}
          <div className="msv-adv-actions">
            <button className="msv-adv-btn-clear" onClick={clearFilters}>
              {t.msv_adv_clear}
            </button>
            <button className="msv-adv-btn-apply" onClick={applyFilters}>
              {t.msv_adv_apply}
            </button>
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="msv-tabs" role="tablist">
        <button
          role="tab" aria-selected={tab === "all"}
          className={`msv-tab${tab === "all" ? " msv-tab--active" : ""}`}
          onClick={() => setTab("all")}
        >{t.msv_tab_all}</button>
        <button
          role="tab" aria-selected={tab === "unread"}
          className={`msv-tab${tab === "unread" ? " msv-tab--active" : ""}`}
          onClick={() => setTab("unread")}
        >
          {t.msv_tab_unread}
          {unreadCount > 0 && <span className="msv-tab-badge">{unreadCount}</span>}
        </button>
      </div>

      {/* Inbox */}
      {visible.length === 0 ? (
        <div className="msv-center msv-center--padded">
          <p className="msv-empty-title">
            {hasActiveFilters ? t.msv_adv_no_results : t.msv_empty_notif}
          </p>
        </div>
      ) : (
        <div className="msv-inbox">
          {visible.map((n) => (
            <div
              key={n.id}
              className={`msv-row${n.is_read ? " msv-row--read" : " msv-row--unread"}`}
              onClick={() => openNotif(n)}
            >
              <div className="msv-row-lead">
                <span className={`msv-read-dot${n.is_read ? " msv-read-dot--read" : ""}`} />
              </div>
              <span className="msv-row-sender">{n.title}</span>
              <span className="msv-row-excerpt">{n.message}</span>
              <span className="msv-row-date">{shortDate(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
