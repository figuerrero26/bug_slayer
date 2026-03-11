import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Barra from "./Barra";
import Home from "./Home";
import Nosotros from "./Nosotros";
import Inscripciones from "./Inscripciones";
import Ferias from "./Ferias";
import Noticias from "./Noticias";
import Login from "./Login";
import Register from "./Register"; // ← IMPORTANTE

function Layout() {

  const location = useLocation();

  return (
    <>
      {/* Ocultar barra en login y register */}
      {location.pathname !== "/login" &&
       location.pathname !== "/register" && <Barra />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/ferias" element={<Ferias />} />
        <Route path="/inscripciones" element={<Inscripciones />} />
        <Route path="/noticias" element={<Noticias />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App(){
  return <Layout />;
}

export default App;