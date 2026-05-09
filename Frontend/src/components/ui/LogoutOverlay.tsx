import { useState, useEffect } from "react";
import "./LogoutOverlay.css";
import { motion, AnimatePresence } from "framer-motion";

const LOGOUT_MESSAGES = [
  "Cerrando sesión de forma segura...",
  "Limpiando datos de sesión...",
  "Todo listo. ¡Hasta pronto!",
];
const CYCLE_MS = 1000;

export default function LogoutOverlay({ initial }: { initial: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => Math.min(i + 1, LOGOUT_MESSAGES.length - 1)),
      CYCLE_MS / LOGOUT_MESSAGES.length,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="dash-logout-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        className="dash-logout-center"
        initial={{ scale: 0.88, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="dash-logout-avatar-wrap">
          <div className="dash-logout-spinner" />
          <div className="dash-logout-letter">{initial}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            className="dash-logout-msg"
            initial={{ opacity: 0, y: 8  }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {LOGOUT_MESSAGES[idx]}
          </motion.p>
        </AnimatePresence>

        <div className="dash-logout-bar">
          <motion.div
            className="dash-logout-bar-fill"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.8, ease: "linear" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
