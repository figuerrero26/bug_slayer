import { useState, useMemo } from "react";
import "../css/CalendarioView.css";

// ── Constantes ────────────────────────────────────────────────────────────────

const DAYS_ES   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Días del evento CONIITI 2026 (20 – 23 de octubre)
const CONIITI = { year: 2026, month: 9, start: 20, end: 23 }; // month 9 = octubre (0-indexed)

// ── Helpers ────────────────────────────────────────────────────────────────────

function isCONIITI(y: number, m: number, d: number): boolean {
  return y === CONIITI.year && m === CONIITI.month && d >= CONIITI.start && d <= CONIITI.end;
}

function daysUntilCONIITI(): number {
  const now     = new Date();
  const target  = new Date(CONIITI.year, CONIITI.month, CONIITI.start);
  const diff    = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

interface CalDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCONIITI: boolean;
}

function buildCalendar(viewY: number, viewM: number, today: Date): CalDay[] {
  const first   = new Date(viewY, viewM, 1);
  const total   = new Date(viewY, viewM + 1, 0).getDate();
  const days: CalDay[] = [];

  // Relleno mes anterior (semana empieza en lunes)
  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(viewY, viewM, -i);
    days.push({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), isCurrentMonth: false, isToday: false, isCONIITI: false });
  }

  // Mes actual
  for (let d = 1; d <= total; d++) {
    const isToday = d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();
    days.push({ day: d, month: viewM, year: viewY, isCurrentMonth: true, isToday, isCONIITI: isCONIITI(viewY, viewM, d) });
  }

  // Relleno mes siguiente para completar 6 filas × 7 columnas = 42
  for (let d = 1; days.length < 42; d++) {
    const dt = new Date(viewY, viewM + 1, d);
    days.push({ day: d, month: dt.getMonth(), year: dt.getFullYear(), isCurrentMonth: false, isToday: false, isCONIITI: false });
  }

  return days;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function CalendarioView() {
  const today = useMemo(() => new Date(), []);

  const [viewY, setViewY]   = useState(today.getFullYear());
  const [viewM, setViewM]   = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const days     = useMemo(() => buildCalendar(viewY, viewM, today), [viewY, viewM, today]);
  const countdown = useMemo(() => daysUntilCONIITI(), []);

  const prevMonth = () => {
    if (viewM === 0) { setViewY((y) => y - 1); setViewM(11); }
    else setViewM((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewM === 11) { setViewY((y) => y + 1); setViewM(0); }
    else setViewM((m) => m + 1);
  };

  const toggleDay = (key: string) =>
    setSelected((prev) => (prev === key ? null : key));

  return (
    <div className="cal-root">

      {/* ── Panel principal ──────────────────────────────────────────── */}
      <div className="cal-card">

        {/* Encabezado con navegación */}
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prevMonth} aria-label="Mes anterior">‹</button>

          <h2 className="cal-month-title">
            {MONTHS_ES[viewM]} {viewY}
          </h2>

          <button className="cal-nav-btn" onClick={nextMonth} aria-label="Mes siguiente">›</button>
        </div>

        {/* Días de la semana */}
        <div className="cal-dow">
          {DAYS_ES.map((d) => (
            <span key={d} className="cal-dow-cell">{d}</span>
          ))}
        </div>

        {/* Grid de días — key fuerza re-render con animación al cambiar mes */}
        <div className="cal-grid" key={`${viewY}-${viewM}`}>
          {days.map((d, i) => {
            const key = `${d.year}-${d.month}-${d.day}`;
            const cls = [
              "cal-day",
              !d.isCurrentMonth   ? "cal-day--other"    : "",
              d.isToday           ? "cal-day--today"    : "",
              d.isCONIITI         ? "cal-day--coniiti"  : "",
              selected === key    ? "cal-day--selected" : "",
            ].filter(Boolean).join(" ");

            return (
              <button
                key={i}
                className={cls}
                onClick={() => d.isCurrentMonth && toggleDay(key)}
                aria-pressed={selected === key}
                tabIndex={d.isCurrentMonth ? 0 : -1}
              >
                {d.day}
              </button>
            );
          })}
        </div>

      </div>

      {/* ── Panel lateral ────────────────────────────────────────────── */}
      <aside className="cal-aside">

        {/* Cuenta regresiva CONIITI */}
        <div className="cal-aside-card cal-aside-card--coniiti">
          <span className="cal-coniiti-chip">CONIITI 2026</span>
          <p className="cal-coniiti-dates">20 – 23 de Octubre</p>
          <div className="cal-countdown">
            <span className="cal-countdown-num">{countdown}</span>
            <span className="cal-countdown-label">días restantes</span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="cal-aside-card">
          <h3 className="cal-legend-title">Leyenda</h3>
          <ul className="cal-legend">
            <li className="cal-legend-item">
              <span className="cal-legend-dot cal-legend-dot--today" />
              <span>Hoy</span>
            </li>
            <li className="cal-legend-item">
              <span className="cal-legend-dot cal-legend-dot--coniiti" />
              <span>Días CONIITI</span>
            </li>
            <li className="cal-legend-item">
              <span className="cal-legend-dot cal-legend-dot--selected" />
              <span>Seleccionado</span>
            </li>
          </ul>
        </div>

      </aside>
    </div>
  );
}
