import { useEffect } from "react";
import { motion } from "framer-motion";
import "./css/Splash.css";

const LOGO_URL = "https://www.ucatolica.edu.co/portal/wp-content/uploads/2025/10/Logos_White.png";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {

  useEffect(() => {
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.img
        src={LOGO_URL}
        className="splash-logo"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      <motion.h1
        className="splash-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        CONIITI 2026
      </motion.h1>

      <motion.p
        className="splash-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        País invitado · Italia
      </motion.p>

      <motion.div
        className="splash-bar-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="splash-bar"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.4, duration: 0.9, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
