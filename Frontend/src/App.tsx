import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Barra from "./layout/Barra";

import Home from "./pages/home/Home";
import Nosotros from "./pages/nosotros/Nosotros";
import Ferias from "./pages/ferias/Ferias";
import Inscripciones from "./pages/inscripciones/Inscripciones";
import Noticias from "./pages/noticias/Noticias";
import Coniiti2015 from "./pages/ferias/Coniiti2015";
import Dashboard from "./dashboard/Dashboard";
import Admin from "./admin/Admin";

import Login from "./auth/Login";
import Register from "./auth/Register";

function Layout() {

  const location = useLocation();

  const hideBar =
    location.pathname === "/login" ||
    location.pathname === "/crear-cuenta" ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/admin");

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

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Admin — ruta oculta, sin enlace en navegación, sin autenticación */}
        <Route path="/admin/conferences" element={<Admin />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

export default function App() {
  return <Layout />;
}