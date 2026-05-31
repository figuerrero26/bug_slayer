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
  { label: "Aviso de Privacidad",                    href: "#" },
  { label: "Estatuto General",                       href: "#" },
  { label: "Información Tributaria",                 href: "#" },
  { label: "Política de Bienestar Universitario",    href: "#" },
  { label: "Reglamento Estudiantil",                 href: "#" },
  { label: "Valores Pecuniarios",                    href: "#" },
];

const LEGAL_COL2 = [
  { label: "Autorización Tratamiento de Datos Personales Web", href: "/politica-tratamiento-datos.pdf" },
  { label: "Política de Tratamiento de Datos Personales",      href: "/politica-tratamiento-datos.pdf" },
  { label: "Términos y Condiciones de Uso del Sitio",          href: "#" },
  { label: "Transparencia y Acceso a la Información Pública",  href: "#" },
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
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
            <ul>
              {LEGAL_COL2.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.href !== "#" && { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

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

      {/* ── Onda al fondo del todo ── */}
      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fwGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#0b0f2b" />
              <stop offset="40%"  stopColor="#0e2d5c" />
              <stop offset="100%" stopColor="#0b0f2b" />
            </linearGradient>
            <linearGradient id="fwGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#003087" stopOpacity="0.4" />
              <stop offset="50%"  stopColor="#1a5fd4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#003087" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 L0,22 C180,0 380,48 600,18 C820,0 1020,40 1200,14 C1320,0 1400,28 1440,18 L1440,60 Z"
            fill="url(#fwGrad1)"
          />
          <path
            d="M0,60 L0,38 C260,12 520,52 780,30 C1040,10 1260,44 1440,30 L1440,60 Z"
            fill="url(#fwGrad2)"
          />
        </svg>
      </div>

    </footer>
  );
}

export default Footer;
