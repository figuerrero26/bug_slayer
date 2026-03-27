
import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn } from "react-icons/fa";
import "./css/Nosotros.css";


const objetivos = [
  { icono: "🌐", titulo: "Internacionalización", texto: "Intercambio de conocimiento entre ingenieros del mundo." },
  { icono: "💡", titulo: "Innovación", texto: "Últimas tendencias tecnológicas e investigaciones aplicadas." },
  { icono: "🤝", titulo: "Networking", texto: "Redes entre académicos, empresas e investigadores." },
  { icono: "📚", titulo: "Formación", texto: "Fortalecimiento de competencias en ingeniería." },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Nosotros(): React.JSX.Element {
  return (
    <section className="nos-section">
      <div className="nos-container">

        {/* QUÉ ES */}
        <div className="nos-block">
          <h2>¿Qué es CONIITI?</h2>
          <p>
            El <strong>Congreso Internacional de Innovación y Tendencias en Ingeniería</strong> es el
            evento académico insignia de la Universidad Católica de Colombia. En su XII edición,
            CONIITI 2026 tiene como país invitado a <strong>Italia</strong>.
          </p>
        </div>

        {/* HISTORIA */}
        <div className="nos-block">
          <h2>Historia</h2>
          <p>
            Desde 2014, CONIITI ha crecido de un evento nacional a un congreso con presencia en más
            de <strong>20 países</strong>. Cada edición ha impulsado la publicación de investigaciones
            indexadas y el fortalecimiento de redes internacionales.
          </p>
        </div>

        {/* UNIVERSIDAD */}
        <div className="nos-block">
          <h2>Universidad Organizadora</h2>
          <p>
            La <strong>Universidad Católica de Colombia</strong>, con más de 50 años de historia y
            acreditación de alta calidad, es la sede y alma de CONIITI. Su Facultad de Ingeniería
            lidera cada edición con rigor académico y visión global.
          </p>
          <a
            href="https://www.ucatolica.edu.co"
            target="_blank"
            rel="noreferrer"
            className="nos-link"
          >
            Visitar sitio oficial →
          </a>

          {/* REDES SOCIALES */}
          <div className="nos-redes">
            <a href="https://www.facebook.com/ucatolicaco/" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/ucatolicaco" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.youtube.com/user/ucatolicaco" target="_blank" rel="noreferrer" aria-label="YouTube">
              <FaYoutube />
            </a>
            <a href="https://co.linkedin.com/school/universidadcatólicadecolombia/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* OBJETIVOS */}
        <div className="nos-block">
          <h2>Objetivos</h2>
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