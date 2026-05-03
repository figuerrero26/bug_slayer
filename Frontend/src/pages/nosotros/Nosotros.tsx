import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useLang } from "../../context/LanguageContext";
import "../../css/Nosotros.css";

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Nosotros(): React.JSX.Element {
  const { t } = useLang();

  const objetivos = [
    { icono: "🌐", titulo: t.goal1_t, texto: t.goal1_p },
    { icono: "💡", titulo: t.goal2_t, texto: t.goal2_p },
    { icono: "🤝", titulo: t.goal3_t, texto: t.goal3_p },
    { icono: "📚", titulo: t.goal4_t, texto: t.goal4_p },
  ];

  return (
    <section className="nos-section">
      <div className="nos-container">

        <div className="nos-block">
          <h2>{t.nos_what}</h2>
          <p>{t.nos_what_p}</p>
        </div>

        <div className="nos-block">
          <h2>{t.nos_history}</h2>
          <p>{t.nos_history_p}</p>
        </div>

        <div className="nos-block">
          <h2>{t.nos_uni}</h2>
          <p>{t.nos_uni_p}</p>
          <a href="https://www.ucatolica.edu.co" target="_blank" rel="noreferrer" className="nos-link">
            {t.nos_visit}
          </a>
        </div>

        <div className="nos-block">
          <h2>{t.nos_goals}</h2>
          <div className="nos-grid">
            {objetivos.map((obj, i) => (
              <motion.div
                className="nos-card"
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <span className="nos-icono">{obj.icono}</span>
                <h3>{obj.titulo}</h3>
                <p>{obj.texto}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
