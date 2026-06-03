import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { SEARCH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./ProfileView.css";

import type { User }             from "../../interfaces/user";
import type { ConferenceTicket } from "../../interfaces/conference";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function serial(n: number) {
  return `A ${String(n).padStart(7, "0")}`;
}

const TZ = "America/Bogota"; // UTC-5, sin horario de verano

function colDateKey(iso: string): string {
  // "YYYY-MM-DD" en hora Colombia — usado para agrupar y comparar días
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

function colDayLabel(iso: string): string {
  // "Martes 17 de octubre"
  const raw = new Date(iso).toLocaleDateString("es-CO", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function fmtDateShort(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso)
    .toLocaleDateString("es-CO", { timeZone: TZ, day: "numeric", month: "short" })
    .toUpperCase();
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ── CountdownCard ─────────────────────────────────────────────────────────────
function CountdownCard() {
  const { t } = useLang();
  const TARGET = useMemo(() => new Date("2026-10-20T08:00:00"), []);

  const calc = (): TimeLeft => {
    const diff = TARGET.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days:    Math.floor(diff / 86_400_000),
      hours:   Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000)  / 60_000),
      seconds: Math.floor((diff % 60_000)     / 1_000),
    };
  };

  const [time, setTime] = useState<TimeLeft>(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [TARGET]);

  const units = [
    { v: time.days,    l: t.prof_days    },
    { v: time.hours,   l: t.prof_hours   },
    { v: time.minutes, l: t.prof_min     },
    { v: time.seconds, l: t.prof_seg     },
  ];

  const days = [t.prof_day0, t.prof_day1, t.prof_day2, t.prof_day3];

  return (
    <div className="profv-cd-card">
      <div className="profv-cd-header">
        <span className="profv-cd-badge">{t.prof_upcoming}</span>
        <h3 className="profv-cd-title">CONIITI 2026</h3>
        <p className="profv-cd-subtitle">{t.prof_event_subtitle}</p>
      </div>

      <div className="profv-cd-grid">
        {units.map(({ v, l }) => (
          <div key={l} className="profv-cd-unit">
            <span className="profv-cd-num">{String(v).padStart(2, "0")}</span>
            <span className="profv-cd-label">{l}</span>
          </div>
        ))}
      </div>

      <div className="profv-cd-timeline">
        {days.map((day, i) => (
          <div key={day} className="profv-cd-day">
            <div className={`profv-cd-dot${i === 0 ? " profv-cd-dot--first" : ""}`} />
            <span>{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TicketsTiltCard ───────────────────────────────────────────────────────────
function TicketsTiltCard({ userId }: { userId: number }) {
  const { t }    = useLang();
  const navigate = useNavigate();

  const [conferences, setConferences] = useState<ConferenceTicket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dropOpen, setDropOpen]       = useState(false);
  const [idx, setIdx]                 = useState(0);

  const tiltRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${SEARCH_URL}/users/${userId}/conferences`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((d: ConferenceTicket[]) => setConferences(d))
      .catch(err => { if (err.name !== "AbortError") console.error(err); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [userId]);

  // ── Cierra dropdown al hacer click fuera ──────────────────────────────────
  useEffect(() => {
    if (!dropOpen) return;
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dropOpen]);

  // ── Grupos de fechas únicos (Colombia) ────────────────────────────────────
  const dateGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups: { key: string; label: string }[] = [];
    for (const c of conferences) {
      if (!c.schedule) continue;
      const key = colDateKey(c.schedule);
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push({ key, label: colDayLabel(c.schedule) });
    }
    return groups.sort((a, b) => a.key.localeCompare(b.key));
  }, [conferences]);

  // ── Pre-selecciona hoy (Colombia) o la primera fecha disponible ───────────
  useEffect(() => {
    if (dateGroups.length === 0) return;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
    const found = dateGroups.find(g => g.key === today);
    setSelectedKey(found ? today : dateGroups[0].key);
  }, [dateGroups]);

  // ── Resetea carrusel al cambiar día ───────────────────────────────────────
  useEffect(() => { setIdx(0); }, [selectedKey]);

  // ── Filtro + expiración + orden cronológico (UTC comparación directa) ─────
  const visibleConfs = useMemo(() => {
    if (!selectedKey) return [];
    const nowMs  = Date.now();
    const GRACE  = 30 * 60_000;   // 30 min de gracia después de finalizar
    const DUR    = 90 * 60_000;   // duración estimada si no hay schedule_end
    return conferences
      .filter(c => {
        if (!c.schedule) return false;
        if (colDateKey(c.schedule) !== selectedKey) return false;
        const startMs = new Date(c.schedule).getTime();
        const endMs   = c.schedule_end
          ? new Date(c.schedule_end).getTime()
          : startMs + DUR;
        return nowMs <= endMs + GRACE;
      })
      .sort((a, b) => new Date(a.schedule!).getTime() - new Date(b.schedule!).getTime());
  }, [conferences, selectedKey]);

  const ci   = Math.min(idx, Math.max(visibleConfs.length - 1, 0));
  const conf = visibleConfs[ci] ?? null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = tiltRef.current?.getBoundingClientRect();
    if (!r) return;
    rotateY.set(((e.clientX - r.left) / r.width  - 0.5) * 10);
    rotateX.set(-((e.clientY - r.top)  / r.height - 0.5) * 10);
  };
  const onLeave = () => { rotateX.set(0); rotateY.set(0); };

  const dropLabel = dateGroups.find(g => g.key === selectedKey)?.label ?? "—";

  // ── Sin inscripciones en absoluto ─────────────────────────────────────────
  if (!loading && conferences.length === 0) {
    return (
      <div className="profv-ticket-outer">
        <div className="profv-tickets-header">
          <h3 className="profv-tickets-title">{t.prof_your_tickets}</h3>
        </div>
        <div className="profv-empty-ticket">
          <div className="profv-empty-icon" aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/>
              <path d="M2 15v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/>
              <path d="M22 9a3 3 0 0 1 0 6"/><path d="M2 9a3 3 0 0 0 0 6"/>
            </svg>
          </div>
          <p className="profv-empty-title">{t.prof_no_tickets}</p>
          <p className="profv-empty-sub">{t.prof_no_tickets_sub}</p>
          <button className="profv-empty-btn" onClick={() => navigate("/inscripciones")}>
            {t.prof_explore}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profv-ticket-outer">

      {/* ── Header: título + dropdown de fechas ── */}
      <div className="profv-tickets-header">
        <h3 className="profv-tickets-title">{t.prof_your_tickets}</h3>

        {dateGroups.length > 0 && (
          <div ref={dropRef} className="profv-date-drop-wrap">
            <button
              className={`profv-date-drop-btn${dropOpen ? " profv-date-drop-btn--open" : ""}`}
              onClick={() => setDropOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={dropOpen}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <span>{dropLabel}</span>
              <svg
                className={`profv-drop-chevron${dropOpen ? " profv-drop-chevron--open" : ""}`}
                width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.ul
                  role="listbox"
                  className="profv-date-drop-menu"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: -6,  scale: 0.97 }}
                  transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
                >
                  {dateGroups.map(group => (
                    <li key={group.key} role="option" aria-selected={group.key === selectedKey}>
                      <button
                        className={`profv-date-drop-item${group.key === selectedKey ? " profv-date-drop-item--active" : ""}`}
                        onClick={() => { setSelectedKey(group.key); setDropOpen(false); }}
                      >
                        <span className="profv-drop-check">
                          {group.key === selectedKey && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        {group.label}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Estado vacío del día seleccionado ── */}
      {!loading && visibleConfs.length === 0 ? (
        <div className="profv-no-day-tickets">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="8" x2="16" y2="16"/>
            <line x1="16" y1="8" x2="8"  y2="16"/>
          </svg>
          <span>{t.prof_no_tickets_day}</span>
        </div>
      ) : (
        <div className="profv-ticket-center">

          <motion.div
            ref={tiltRef}
            className="profv-ticket-tilt"
            style={{ rotateX, rotateY, transformPerspective: 1000 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={ci}
                className="profv-ticket"
                initial={{ opacity: 0, rotateY: -90, scale: 0.94 }}
                animate={{ opacity: 1, rotateY:   0, scale: 1    }}
                exit={{    opacity: 0, rotateY:  90, scale: 0.94 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* ── CUERPO PRINCIPAL ── */}
                <div className="profv-ticket-body">
                  <div className="profv-ticket-inner">

                    <div className="profv-ticket-brand-row">
                      <span className="profv-ticket-brand">CONIITI</span>
                      <span className="profv-ticket-year-tag">2026</span>
                    </div>

                    {loading ? (
                      <p className="profv-ticket-misc">{t.prof_loading}</p>
                    ) : conf ? (
                      <>
                        <h2 className="profv-ticket-conf-title">{conf.title}</h2>
                        {conf.speaker_name && (
                          <p className="profv-ticket-speaker">{conf.speaker_name}</p>
                        )}
                        <div className="profv-ticket-meta-row">
                          <span className="profv-ticket-meta-date">
                            {fmtDateShort(conf.schedule)}
                            {fmtTime(conf.schedule) ? ` · ${fmtTime(conf.schedule)}` : ""}
                          </span>
                          <span className="profv-ticket-meta-venue">{t.prof_ticket_venue}</span>
                        </div>
                        <div className="profv-ticket-rule profv-ticket-rule--dim" />
                        <div className="profv-ticket-grid">
                          <div className="profv-ticket-grid-cell">
                            <span className="profv-ticket-grid-label">{t.prof_ticket_sede}</span>
                            <span className="profv-ticket-grid-value">{conf.campus_name || "—"}</span>
                          </div>
                          <div className="profv-ticket-grid-cell">
                            <span className="profv-ticket-grid-label">{t.prof_ticket_sala}</span>
                            <span className="profv-ticket-grid-value">{conf.room_name || "—"}</span>
                          </div>
                          <div className="profv-ticket-grid-cell">
                            <span className="profv-ticket-grid-label">{t.prof_ticket_serial}</span>
                            <span className="profv-ticket-grid-value profv-ticket-grid-value--serial">
                              {serial(conf.registration_id)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}

                  </div>
                </div>

                {/* ── PERFORACIÓN ── */}
                <div className="profv-ticket-perf" aria-hidden="true" />

                {/* ── STUB DERECHO — QR ── */}
                <div className="profv-ticket-stub profv-ticket-stub--right">
                  <div className="profv-ticket-stub-header">
                    <span className="profv-ticket-stub-brand">CONIITI</span>
                    <span className="profv-ticket-stub-year">2026</span>
                  </div>
                  <div className="profv-ticket-qr-wrap">
                    <QRCodeSVG
                      value={conf?.qr_payload ?? "CONIITI|SIN-INSCRIPCION"}
                      size={84}
                      bgColor="transparent"
                      fgColor={conf?.qr_payload ? "#0b1628" : "rgba(11,22,40,0.22)"}
                      level="H"
                    />
                    <span className="profv-ticket-qr-label">CONIITI</span>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Navegación del carrusel ── */}
          {visibleConfs.length > 1 && (
            <div className="profv-ticket-nav">
              <button
                className="profv-ticket-nav-arrow"
                onClick={() => setIdx(i => (i - 1 + visibleConfs.length) % visibleConfs.length)}
                aria-label={t.prof_prev}
              >‹</button>

              <div className="profv-ticket-dots">
                {visibleConfs.map((_, i) => (
                  <button
                    key={i}
                    className={`profv-ticket-nav-dot${i === ci ? " active" : ""}`}
                    onClick={() => setIdx(i)}
                    aria-label={`Ticket ${i + 1}`}
                  />
                ))}
              </div>

              <button
                className="profv-ticket-nav-arrow"
                onClick={() => setIdx(i => (i + 1) % visibleConfs.length)}
                aria-label={t.prof_next_ticket}
              >›</button>

              <span className="profv-ticket-nav-count">
                {ci + 1} / {visibleConfs.length}
              </span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// ── ProfileView ───────────────────────────────────────────────────────────────
export default function ProfileView({
  user,
  onEdit,
  userId,
}: {
  user: User;
  onEdit: () => void;
  userId: number;
}) {
  const { t } = useLang();

  return (
    <div className="profv-wrapper">

      <div className="profile-card">
        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{user.name}</h2>
          </div>
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">{t.prof_reg_date}</span>
              <span className="detail-value">{user.registeredAt ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.prof_country}</span>
              <span className="detail-value">{user.country ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.prof_birthdate}</span>
              <span className="detail-value">{user.birthdate ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.prof_email}</span>
              <span className="detail-value">{user.email || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.prof_phone}</span>
              <span className="detail-value">{user.phone ?? "—"}</span>
            </div>
          </div>
        </div>

        <button className="btn-edit-icon" onClick={onEdit} title={t.prof_edit}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <div className="profv-lower-grid">
        <CountdownCard />
        <TicketsTiltCard userId={userId} />
      </div>

    </div>
  );
}
