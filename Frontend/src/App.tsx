import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Barra from "./Barra";

import Home from "./Home";
import Nosotros from "./Nosotros";
import Ferias from "./Ferias";
import Inscripciones from "./Inscripciones";
import Noticias from "./Noticias";
import Coniiti2015 from "./Coniiti2015";

import Login from "./Login";
import Register from "./Register";

function Layout() {

  const location = useLocation();

  const hideBar =
    location.pathname === "/login" ||
    location.pathname === "/crear-cuenta";

  return (
    <>
      {!hideBar && <Barra />}

      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/ferias" element={<Ferias />} />
        <Route path="/inscripciones" element={<Inscripciones />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/coniiti2015" element={<Coniiti2015 />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/crear-cuenta" element={<Register />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

export default function App() {
  return <Layout />;
}