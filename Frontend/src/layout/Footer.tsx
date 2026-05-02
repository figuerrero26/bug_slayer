import React from "react";
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn } from "react-icons/fa";
import "../css/Home.css";

import logoIcontec from "../assets/Logo_Icontec_universidad.png";
import logoAltaCalidad from "../assets/logo-alta-calidad-ho.svg";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-logos">
          <img src={logoIcontec} alt="Icontec" />
          <img src={logoAltaCalidad} alt="Alta Calidad" />
        </div>

        <div className="footer-info">
          <h3>Universidad Católica de Colombia</h3>
          <p>Centro de Convenciones</p>
          <p>© 2026 CONIITI - Todos los derechos reservados</p>
        </div>

        <div className="footer-redes">
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
    </footer>
  );
}

export default Footer;