import React from "react";
import "./css/Home.css"; // usamos el mismo css o puedes crear Footer.css

import logoIcontec from "./assets/Logo_Icontec_universidad.png";
import logoAltaCalidad from "./assets/logo-alta-calidad-ho.svg";

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

      </div>
    </footer>
  );
}

export default Footer;