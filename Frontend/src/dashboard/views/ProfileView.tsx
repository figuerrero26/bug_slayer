import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { SEARCH_URL } from "../../services/api";
import "./ProfileView.css";

import type { User }             from "../../interfaces/user";
import type { ConferenceTicket } from "../../interfaces/conference";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null): string {
  if (!iso) return "Por definir";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function serial(n: number) {
  return `A ${String(n).padStart(7, "0")}`;
}

// ── CountdownCard ─────────────────────────────────────────────────────────────
function CountdownCard() {
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

  return (
    <div className="profv-cd-card">
      <div className="profv-cd-header">
        <span className="profv-cd-badge">Próximo evento</span>
        <h3 className="profv-cd-title">CONIITI 2026</h3>
        <p className="profv-cd-subtitle">20 octubre · Bogotá, Colombia</p>
      </div>

      <div className="profv-cd-grid">
        {([
          { v: time.days,    l: "días"  },
          { v: time.hours,   l: "horas" },
          { v: time.minutes, l: "min"   },
          { v: time.seconds, l: "seg"   },
        ] as const).map(({ v, l }) => (
          <div key={l} className="profv-cd-unit">
            <span className="profv-cd-num">{String(v).padStart(2, "0")}</span>
            <span className="profv-cd-label">{l}</span>
          </div>
        ))}
      </div>

      <div className="profv-cd-timeline">
        {(["Lun 20 Oct", "Mar 21 Oct", "Mié 22 Oct", "Jue 23 Oct"] as const).map((day, i) => (
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
  const [conferences, setConferences] = useState<ConferenceTicket[]>([]);
  const [idx, setIdx]                 = useState(0);
  const [loading, setLoading]         = useState(true);
  const wrapRef                       = useRef<HTMLDivElement>(null);
  const rotateX                       = useMotionValue(0);
  const rotateY                       = useMotionValue(0);

  useEffect(() => {
    fetch(`${SEARCH_URL}/users/${userId}/conferences`)
      .then((r) => r.json())
      .then((d: ConferenceTicket[]) => setConferences(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    rotateY.set(x * 10);   // máx 10° — legible
    rotateX.set(-y * 10);
  };
  const onLeave = () => { rotateX.set(0); rotateY.set(0); };

  const conf = conferences[idx] ?? null;

  return (
    <div className="profv-ticket-outer">

      {/* Tilt wrapper */}
      <motion.div
        ref={wrapRef}
        className="profv-ticket-tilt"
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="profv-ticket"
            initial={{ opacity: 0, rotateY: -90, scale: 0.94 }}
            animate={{ opacity: 1, rotateY:   0, scale: 1    }}
            exit={{    opacity: 0, rotateY:  90, scale: 0.94 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >

            {/* ── STUB IZQUIERDO ── */}
            <div className="profv-ticket-stub">
              <div className="profv-ticket-barcode" />
              <span className="profv-ticket-stub-serial">
                {conf ? serial(conf.registration_id) : "A 0000000"}
              </span>
            </div>

            {/* ── PERFORACIÓN — los agujeros son CSS mask-image (sin hijos) ── */}
            <div className="profv-ticket-perf" aria-hidden="true" />

            {/* ── CUERPO PRINCIPAL ── */}
            <div className="profv-ticket-body">
              <div className="profv-ticket-inner">

                <div className="profv-ticket-brand-row">
                  <span className="profv-ticket-brand">CONIITI</span>
                  <span className="profv-ticket-year-tag">2026</span>
                </div>

                <div className="profv-ticket-rule" />

                {loading ? (
                  <p className="profv-ticket-misc">Cargando…</p>
                ) : conf ? (
                  <>
                    <h3 className="profv-ticket-title">{conf.title}</h3>
                    {conf.speaker_name && (
                      <p className="profv-ticket-misc">{conf.speaker_name}</p>
                    )}
                    <div className="profv-ticket-serial-box">
                      {serial(conf.registration_id)}
                    </div>
                    <p className="profv-ticket-admit">
                      CONFERENCIA · {fmtDate(conf.schedule)}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="profv-ticket-title profv-ticket-title--empty">
                      ADMIT ONE
                    </h3>
                    <div className="profv-ticket-serial-box">A 0000000</div>
                    <p className="profv-ticket-admit">Sin conferencias inscritas</p>
                  </>
                )}

              </div>
            </div>

            {/* ── STUB DERECHO ── */}
            <div className="profv-ticket-stub profv-ticket-stub--right">
              <span className="profv-ticket-stub-serial profv-ticket-stub-serial--right">
                {conf ? serial(conf.registration_id) : "A 0000000"}
              </span>
            </div>

          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Selector de conferencias ── */}
      {conferences.length > 1 && (
        <div className="profv-ticket-nav">
          <button
            className="profv-ticket-nav-arrow"
            onClick={() => setIdx((i) => (i - 1 + conferences.length) % conferences.length)}
            aria-label="Anterior"
          >‹</button>

          <div className="profv-ticket-dots">
            {conferences.map((_, i) => (
              <button
                key={i}
                className={`profv-ticket-nav-dot${i === idx ? " active" : ""}`}
                onClick={() => setIdx(i)}
                aria-label={`Ticket ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="profv-ticket-nav-arrow"
            onClick={() => setIdx((i) => (i + 1) % conferences.length)}
            aria-label="Siguiente"
          >›</button>

          <span className="profv-ticket-nav-count">
            {idx + 1} / {conferences.length}
          </span>
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
              <span className="detail-label">Fecha de registro:</span>
              <span className="detail-value">{user.registeredAt ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">País, ciudad:</span>
              <span className="detail-value">{user.country ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha de nacimiento:</span>
              <span className="detail-value">{user.birthdate ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">E-mail:</span>
              <span className="detail-value">{user.email || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Teléfono:</span>
              <span className="detail-value">{user.phone ?? "—"}</span>
            </div>
          </div>
        </div>

        <button className="btn-edit-icon" onClick={onEdit} title="Editar perfil">
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
