import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn, FaSpotify } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useLang } from "../context/LanguageContext";
import "../css/Home.css";

import logoIcontec     from "../assets/sellos_footer.png";
import logoAltaCalidad from "../assets/logo-alta-calidad-ho.svg";
import logoUcatolica   from "../assets/LogoUcatolica.png";

const SEDES = [
  {
    nombre: "Sede Las Torres",
    direccion: "Avenida Caracas # 46 – 72",
    descripcion: "Charlas magistrales y ponencias en su auditorio principal.",
  },
  {
    nombre: "Sede 4 – Centro de Convenciones",
    direccion: "Carrera 13 # 47 – 30",
    descripcion: "Logística central y eventos de networking.",
  },
  {
    nombre: "Sede Claustro",
    direccion: "Diagonal 46 A # 15 B – 10",
    descripcion: "Salas de informática, workshops teóricos y prácticos.",
  },
];

const TEXTO_BRAND =
  "La Universidad Católica de Colombia es una Institución de Educación Superior sujeta a inspección y vigilancia por el Ministerio de Educación, reconocida mediante Resolución Número 2271 de julio 7 de 1970 del Ministerio de Justicia.";

const LEGAL_COL1 = [
  "Aviso de Privacidad",
  "Estatuto General",
  "Información Tributaria",
  "Política de Bienestar Universitario",
  "Reglamento Estudiantil",
  "Valores Pecuniarios",
];

const LEGAL_COL2 = [
  "Autorización Tratamiento de Datos Personales Web",
  "Política de Tratamiento de Datos Personales",
  "Términos y Condiciones de Uso del Sitio",
  "Transparencia y Acceso a la Información Pública",
];

function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">

      {/* ── Franja superior: 3 columnas ── */}
      <div className="footer-top">

        {/* Col 1 – Identidad universidad */}
        <div className="footer-col footer-col-brand">
          <img src={logoUcatolica} alt="Universidad Católica de Colombia" className="footer-brand-logo" />
          <p className="footer-brand-legal">{TEXTO_BRAND}</p>
          <p className="footer-brand-copy">Universidad Católica de Colombia © Copyright 2017</p>
          <p className="footer-brand-hashtag">#Coniiti2026</p>
        </div>

        {/* Col 2 – Sedes del evento */}
        <div className="footer-col">
          <h4 className="footer-col-title">Sedes del evento</h4>
          {SEDES.map((sede) => (
            <div key={sede.nombre} className="footer-sede">
              <strong>{sede.nombre}</strong>
              <span>{sede.direccion}</span>
              <span className="footer-sede-desc">{sede.descripcion}</span>
            </div>
          ))}
        </div>

        {/* Col 3 – Información legal */}
        <div className="footer-col">
          <h4 className="footer-col-title">Información legal</h4>
          <div className="footer-legal-grid">
            <ul>
              {LEGAL_COL1.map((item) => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
            <ul>
              {LEGAL_COL2.map((item) => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* ── Onda divisoria de ancho completo ── */}
      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Gradiente capa delantera — lee --fw-front-* del CSS */}
            <linearGradient id="fwGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   style={{ stopColor: "var(--fw-front-a)" }} />
              <stop offset="50%"  style={{ stopColor: "var(--fw-front-b)" }} />
              <stop offset="100%" style={{ stopColor: "var(--fw-front-c)" }} />
            </linearGradient>
            {/* Gradiente capa trasera — lee --fw-back-* del CSS */}
            <linearGradient id="fwGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   style={{ stopColor: "var(--fw-back-a)" }} />
              <stop offset="50%"  style={{ stopColor: "var(--fw-back-b)" }} />
              <stop offset="100%" style={{ stopColor: "var(--fw-back-c)" }} />
            </linearGradient>
          </defs>
          {/* Capa trasera — azul UC Colombia, da profundidad */}
          <path
            d="M0,90 L0,68 C60,50 120,30 200,48 C280,66 340,20 440,38
               C540,56 600,15 720,32 C840,49 900,18 1000,36
               C1100,54 1160,22 1260,40 C1340,54 1400,42 1440,50
               L1440,90 Z"
            fill="url(#fwGrad2)" opacity="0.55"
          />
          {/* Capa delantera — dorado UC Colombia, alto contraste */}
          <path
            d="M0,90 L0,75 C80,55 160,35 260,52 C360,69 420,28 540,44
               C660,60 720,22 840,40 C960,58 1020,25 1140,42
               C1260,59 1360,38 1440,52
               L1440,90 Z"
            fill="url(#fwGrad1)" opacity="0.90"
          />
        </svg>
      </div>

      {/* ── Franja inferior: logos + copyright + redes ── */}
      <div className="footer-bottom">

        <div className="footer-logos">
          <img src={logoIcontec}     alt="Icontec"      />
          <img src={logoAltaCalidad} alt="Alta Calidad" />
        </div>

        <div className="footer-info">
          <h3>Universidad Católica de Colombia</h3>
          <p>{t.footer_rights}</p>
        </div>

        <div className="footer-redes">
          <a href="https://www.facebook.com/ucatolicaco/" target="_blank" rel="noreferrer" aria-label="Facebook" className="footer-facebook">
            <FaFacebookF />
          </a>
          <a href="https://www.instagram.com/ucatolicaco" target="_blank" rel="noreferrer" aria-label="Instagram" className="footer-instagram">
            <FaInstagram />
          </a>
          <a href="https://www.youtube.com/user/ucatolicaco" target="_blank" rel="noreferrer" aria-label="YouTube" className="footer-youtube">
            <FaYoutube />
          </a>
          <a href="https://co.linkedin.com/school/universidadcatólicadecolombia/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="footer-linkedin">
            <FaLinkedinIn />
          </a>
          <a href="https://x.com/UCatolicaCo" target="_blank" rel="noreferrer" aria-label="X / Twitter" className="footer-twitter">
            <FaXTwitter />
          </a>
          <a href="https://open.spotify.com/user/31j6c4bmk73citpx2xmxslv4axru" target="_blank" rel="noreferrer" aria-label="Spotify" className="footer-spotify">
            <FaSpotify />
          </a>
        </div>

      </div>

    </footer>
  );
}

export default Footer;
