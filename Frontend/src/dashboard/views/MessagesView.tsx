import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Star, MoreVertical, CornerUpLeft,
  CheckCheck, User, Calendar, MapPin, QrCode,
} from "lucide-react";
import { NOTIFICATIONS_URL, SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./MessagesView.css";

import type { Notification } from "../../interfaces/notification";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConferenceDetails {
  id: number;
  title: string;
  speaker_name: string | null;
  category: string | null;
  schedule: string | null;
  location_text: string | null;
}

type Tab = "all" | "unread";

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now  = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function fullDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const AVATAR_PALETTE = [
  "#1e6fbd", "#0d9488", "#7c3aed", "#dc2626",
  "#ea580c", "#16a34a", "#db2777", "#0891b2",
];

function avatarColor(title: string): string {
  return AVATAR_PALETTE[title.charCodeAt(0) % AVATAR_PALETTE.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId: number;
  onUnreadChange: (count: number) => void;
  searchQuery?: string;
}

export default function MessagesView({ userId, onUnreadChange, searchQuery = "" }: Props) {
  const { t } = useLang();

  const [items, setItems]             = useState<Notification[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>("all");
  const [selected, setSelected]       = useState<Notification | null>(null);
  const [conference, setConference]   = useState<ConferenceDetails | null>(null);
  const [loadingConf, setLoadingConf] = useState(false);

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
    if (!selected?.conference_id) { setConference(null); return; }
    setLoadingConf(true);
    setConference(null);
    fetch(`${SEARCH_URL}/conferences/${selected.conference_id}`)
      .then((r) => r.ok ? r.json() as Promise<ConferenceDetails> : Promise.reject())
      .then(setConference)
      .catch(() => setConference(null))
      .finally(() => setLoadingConf(false));
  }, [selected?.conference_id]);

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

  const openNotif = (n: Notification) => {
    setSelected(n);
    if (!n.is_read) markRead(n.id);
  };

  const goBack = () => { setSelected(null); setConference(null); };

  const markUnread = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    onUnreadChange(items.filter((n) => !n.is_read).length + 1);
  };

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const visible = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items
      .filter((n) => tab === "all" || !n.is_read)
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
  }, [items, tab, searchQuery]);

  // ── Loading ────────────────────────────────────────────────────────────────
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
    const color   = avatarColor(selected.title);
    const initial = selected.title.charAt(0).toUpperCase();

    return (
      <div className="msv-wrapper">

        {/* Toolbar */}
        <div className="msv-toolbar">
          <button className="msv-back-btn" onClick={goBack}>
            <ArrowLeft size={17} strokeWidth={2} />
            <span>{t.msv_back_inbox}</span>
          </button>
          <button className="msv-icon-btn">
            <MoreVertical size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Subject */}
        <div className="msv-subject-row">
          <h2 className="msv-subject">{selected.title}</h2>
          <span className="msv-inbox-chip">{t.msv_label_inbox}</span>
        </div>

        {/* Sender metadata */}
        <div className="msv-sender-row">
          <div className="msv-avatar" style={{ background: color }}>
            {initial}
          </div>
          <div className="msv-sender-info">
            <div className="msv-sender-top">
              <span className="msv-sender-name">{selected.title}</span>
              <span className="msv-sender-email">
                &lt;notificaciones@coniiti.ucc.edu.co&gt;
              </span>
            </div>
            <span className="msv-sender-tome">{t.msv_to_me} ▾</span>
          </div>
          <div className="msv-sender-controls">
            <span className="msv-full-date">{fullDateTime(selected.created_at)}</span>
            <button className="msv-icon-btn"><Star size={15} strokeWidth={1.8} /></button>
            <button className="msv-icon-btn"><CornerUpLeft size={15} strokeWidth={1.8} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="msv-mail-body">
          <p className="msv-body-text">{selected.message}</p>
        </div>

        {/* Conference ticket */}
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
                <h3 className="msv-ticket-title">
                  {conference.title.toUpperCase()}
                </h3>
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
                  {conference.location_text && (
                    <div className="msv-ticket-row">
                      <MapPin size={13} strokeWidth={2} className="msv-ti" />
                      <span>{conference.location_text}</span>
                    </div>
                  )}
                  {conference.category && (
                    <span className="msv-ticket-cat">{conference.category}</span>
                  )}
                </div>
              </div>
              <div className="msv-ticket-stub">
                <QrCode size={46} strokeWidth={1.4} className="msv-qr" />
                <span className="msv-ticket-id">
                  #{String(conference.id).padStart(5, "0")}
                </span>
                <span className="msv-ticket-access">{t.msv_ticket_access}</span>
              </div>
            </div>
          ) : null
        )}

        {/* Actions */}
        <div className="msv-mail-actions">
          <button className="msv-action-btn" onClick={goBack}>
            <CornerUpLeft size={13} strokeWidth={2} />
            {t.msv_reply_close}
          </button>
          <button
            className="msv-action-btn"
            onClick={() => { markUnread(selected.id); goBack(); }}
          >
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
        <button
          className="msv-btn-mark-all"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={14} strokeWidth={2.4} />
          {t.msv_mark_all_read}
        </button>
      </div>

      {/* Tabs */}
      <div className="msv-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "all"}
          className={`msv-tab${tab === "all" ? " msv-tab--active" : ""}`}
          onClick={() => setTab("all")}
        >
          {t.msv_tab_all}
        </button>
        <button
          role="tab"
          aria-selected={tab === "unread"}
          className={`msv-tab${tab === "unread" ? " msv-tab--active" : ""}`}
          onClick={() => setTab("unread")}
        >
          {t.msv_tab_unread}
          {unreadCount > 0 && (
            <span className="msv-tab-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Inbox list */}
      {visible.length === 0 ? (
        <div className="msv-center msv-center--padded">
          <p className="msv-empty-title">{t.msv_empty_notif}</p>
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
                <Star size={14} strokeWidth={1.8} className="msv-star" />
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
