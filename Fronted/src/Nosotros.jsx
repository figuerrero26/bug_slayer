import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Nosotros({ isLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return (
    <div>
      <h1>Nosotros</h1>
      <p>Bienvenido, puede ver esta sección.</p>
    </div>
  );
}

export default Nosotros;