import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaCalendarAlt,
  FaHeart,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import { NOTIFICATIONS_URL } from "../services/api";
import "../css/UserAvatar.css";

import type { UserSession } from "../interfaces/user";

// ── Constants ─────────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { Icon: FaUser,        label: "Ver mi Perfil",    to: "/dashboard?section=profile",     showBadge: false },
  { Icon: FaCalendarAlt, label: "Mis Conferencias", to: "/dashboard?section=conferences", showBadge: false },
  { Icon: FaHeart,       label: "Favoritos",        to: "/dashboard?section=favorites",   showBadge: false },
  { Icon: FaEnvelope,    label: "Mensajes",         to: "/dashboard?section=messages",    showBadge: true  },
  { Icon: FaCog,         label: "Ajustes",          to: "/dashboard?section=settings",    showBadge: false },
];

const LOGOUT_DURATION_MS = 1000;

const LOGOUT_MESSAGES = [
  "Cerrando sesión de forma segura...",
  "Limpiando datos de sesión...",
  "Todo listo. ¡Hasta pronto!",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem("session");
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

// ── Logout Overlay (portal) ───────────────────────────────────────────────────
function LogoutOverlay({ initial }: { initial: string }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMsgIdx((i) => Math.min(i + 1, LOGOUT_MESSAGES.length - 1)),
      LOGOUT_DURATION_MS / LOGOUT_MESSAGES.length,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="ua-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="ua-overlay-center"
        initial={{ scale: 0.88, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Avatar grande con spinner ring */}
        <div className="ua-overlay-avatar-wrap">
          <div className="ua-overlay-spinner" />
          <div className="ua-overlay-letter">{initial}</div>
        </div>

        {/* Mensaje dinámico */}
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            className="ua-overlay-msg"
            initial={{ opacity: 0, y: 8  }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {LOGOUT_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>

        {/* Barra de progreso */}
        <div className="ua-overlay-bar">
          <motion.div
            className="ua-overlay-bar-fill"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: LOGOUT_DURATION_MS / 1000, ease: "linear" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserAvatar() {
  const [session, setSession]           = useState<UserSession | null>(getSession);
  const [open, setOpen]                 = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const wrapperRef                      = useRef<HTMLDivElement>(null);
  const navigate                        = useNavigate();

  // Fetch unread notifications count al montar, al recuperar el foco
  // y cuando otro componente dispara "new-notification"
  useEffect(() => {
    if (!session) return;
    let lastFetch = 0;
    const fetch_ = () => {
      const now = Date.now();
      if (now - lastFetch < 30_000) return; // throttle: máximo 1 fetch cada 30 s en focus
      lastFetch = now;
      fetch(`${NOTIFICATIONS_URL}/notifications/unread/${session.user_id}`)
        .then((r) => r.json())
        .then((d) => setUnreadCount(d.unread_count ?? 0))
        .catch(() => {});
    };
    fetch_();
    window.addEventListener("focus", fetch_);
    window.addEventListener("new-notification", fetch_);
    return () => {
      window.removeEventListener("focus", fetch_);
      window.removeEventListener("new-notification", fetch_);
    };
  }, [session?.user_id]);

  // Sincroniza si el usuario hace login/logout en otra pestaña
  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener("focus", sync);
    window.addEventListener("ua-session-change", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("ua-session-change", sync);
    };
  }, []);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) return null;

  const initial     = session.email.charAt(0).toUpperCase();
  const displayName = session.email.split("@")[0];

  const handleLogout = () => {
    setOpen(false);
    setIsLoggingOut(true);
    setTimeout(() => {
      sessionStorage.removeItem("session");
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("ua-session-change"));
      navigate("/");
    }, LOGOUT_DURATION_MS);
  };

  const handleNav = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* ── Avatar + Dropdown ── */}
      <div className="ua-wrapper" ref={wrapperRef}>

        <button
          className={`ua-avatar-btn${open ? " ua-avatar-btn--active" : ""}`}
          onClick={() => setOpen((p) => !p)}
          aria-label="Menú de usuario"
          aria-expanded={open}
          disabled={isLoggingOut}
        >
          {initial}
          {unreadCount > 0 && (
            <span className="ua-unread-badge" aria-label={`${unreadCount} mensajes sin leer`}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              className="ua-dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Cabecera */}
              <div className="ua-header">
                <div className="ua-header-avatar">{initial}</div>
                <div className="ua-header-info">
                  <p className="ua-header-name">{displayName}</p>
                  <p className="ua-header-email">{session.email}</p>
                </div>
              </div>

              <div className="ua-divider" />

              {/* Opciones */}
              <nav className="ua-nav">
                {MENU_ITEMS.map(({ Icon, label, to, showBadge }) => (
                  <button
                    key={label}
                    className="ua-item"
                    onClick={() => handleNav(to)}
                  >
                    <Icon className="ua-item-icon" />
                    <span>{label}</span>
                    {showBadge && unreadCount > 0 && (
                      <span className="ua-item-badge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="ua-divider" />

              {/* Cerrar sesión */}
              <button className="ua-logout" onClick={handleLogout}>
                <FaSignOutAlt className="ua-item-icon" />
                <span>Cerrar Sesión</span>
              </button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Logout Overlay — montado en document.body via portal ── */}
      {isLoggingOut &&
        createPortal(<LogoutOverlay initial={initial} />, document.body)}
    </>
  );
}
