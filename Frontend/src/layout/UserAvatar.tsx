import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaCalendarAlt,
  FaHeart,
  FaEnvelope,
  FaSignOutAlt,
} from "react-icons/fa";

import "../css/UserAvatar.css";

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserSession {
  token: string;
  user_id: number;
  email: string;
}

interface MenuItem {
  Icon: React.ElementType;
  label: string;
  to: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MENU_ITEMS: MenuItem[] = [
  { Icon: FaUser,        label: "Ver mi Perfil",    to: "/dashboard"     },
  { Icon: FaCalendarAlt, label: "Mis Conferencias", to: "/dashboard"     },
  { Icon: FaHeart,       label: "Favoritos",        to: "/dashboard"     },
  { Icon: FaEnvelope,    label: "Mensajes",         to: "/dashboard"     },
];

const LOGOUT_DURATION_MS = 3400;

const LOGOUT_MESSAGES = [
  "Cerrando sesión de forma segura...",
  "Protegiendo tu información...",
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
  const wrapperRef                      = useRef<HTMLDivElement>(null);
  const navigate                        = useNavigate();

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
                {MENU_ITEMS.map(({ Icon, label, to }) => (
                  <button
                    key={label}
                    className="ua-item"
                    onClick={() => handleNav(to)}
                  >
                    <Icon className="ua-item-icon" />
                    <span>{label}</span>
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
