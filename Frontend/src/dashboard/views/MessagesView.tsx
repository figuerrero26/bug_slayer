import { useEffect, useState } from "react";
import { NOTIFICATIONS_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./MessagesView.css";

import type { Notification } from "../../interfaces/notification";

interface Props {
  userId: number;
  onUnreadChange: (count: number) => void;
  searchQuery?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MessagesView({ userId, onUnreadChange, searchQuery = "" }: Props) {
  const { t } = useLang();
  const [items, setItems]     = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const TYPE_LABEL: Record<string, string> = {
    info:    t.msv_type_info,
    alerta:  t.msv_type_alerta,
    sistema: t.msv_type_sistema,
  };

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

  const markRead = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    onUnreadChange(items.filter((n) => !n.is_read && n.id !== id).length);
    fetch(`${NOTIFICATIONS_URL}/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  };

  // ── Estados vacíos ─────────────────────────────────────────────────────────
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
        <span className="msv-empty-icon">⚠️</span>
        <p className="msv-hint">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="msv-center">
        <span className="msv-empty-icon">💬</span>
        <p className="msv-empty-title">{t.msv_empty_title}</p>
        <p className="msv-hint">{t.msv_empty_sub}</p>
      </div>
    );
  }

  const q = searchQuery.toLowerCase();
  const visible = items.filter(
    (n) => !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
  );
  const unreadCount = items.filter((n) => !n.is_read).length;

  // ── Lista ──────────────────────────────────────────────────────────────────
  return (
    <div className="msv-wrapper">

      <div className="msv-header">
        <h2 className="msv-heading">{t.msv_heading}</h2>
        {unreadCount > 0 && (
          <span className="msv-unread-pill">
            {t.msv_unread.replace("{0}", String(unreadCount))}
          </span>
        )}
      </div>

      <div className="msv-list">
        {visible.map((n) => (
          <div
            key={n.id}
            className={`msv-card msv-card--${n.type}${n.is_read ? " msv-card--read" : ""}`}
            onClick={() => !n.is_read && markRead(n.id)}
          >
            <div className="msv-card-top">
              <div className="msv-card-left">
                {!n.is_read && <span className="msv-dot" aria-label={t.msv_unread_label} />}
                <span className="msv-title">{n.title}</span>
              </div>
              <div className="msv-card-right">
                <span className={`msv-badge msv-badge--${n.type}`}>
                  {TYPE_LABEL[n.type] ?? n.type}
                </span>
                <span className="msv-date">{formatDate(n.created_at)}</span>
              </div>
            </div>

            <p className="msv-message">{n.message}</p>

            {!n.is_read && (
              <button
                className="msv-btn-read"
                onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
              >
                {t.msv_mark_read}
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
