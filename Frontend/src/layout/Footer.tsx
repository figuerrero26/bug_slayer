import React from "react";
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn, FaSpotify } from "react-icons/fa";
import { useLang } from "../context/LanguageContext";
import "../css/Home.css";

import logoIcontec from "../assets/Logo_Icontec_universidad.png";
import logoAltaCalidad from "../assets/logo-alta-calidad-ho.svg";

function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-logos">
          <img src={logoIcontec} alt="Icontec" />
          <img src={logoAltaCalidad} alt="Alta Calidad" />
        </div>

        <div className="footer-info">
          <h3>Universidad Católica de Colombia</h3>
          <p>{t.footer_center}</p>
          <p>{t.footer_rights}</p>
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
          <a href="https://open.spotify.com/user/31j6c4bmk73citpx2xmxslv4axru" target="_blank" rel="noreferrer" aria-label="Spotify" className="footer-spotify">
            <FaSpotify />
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;