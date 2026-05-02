import "../../css/Ferias.css";
import { Link } from "react-router-dom";

function Ferias() {
  return (
    <div className="ferias-container">
      <h1>Nuestras Ferias</h1>

      <div className="ferias-grid">

        <Link to="/coniiti2015" className="feria-card">
          <h2>CONIITI 2015</h2>
          <p>Ver información del evento.</p>
        </Link>

      </div>
    </div>
  );
}

export default Ferias;