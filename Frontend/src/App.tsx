import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Barra from "./layout/Barra.tsx";

import Home from "./pages/home/Home.tsx";
import Nosotros from "./pages/nosotros/Nosotros.tsx";
import Ferias from "./pages/ferias/Ferias.tsx";
import Inscripciones from "./pages/inscripciones/Inscripciones.tsx";
import Noticias from "./pages/noticias/Noticias.tsx";
import Coniiti2015 from "./pages/ferias/Coniiti2015.tsx";
import Dashboard from "./dashboard/Dashboard.tsx";
import Admin from "./admin/Admin.tsx";
import Footer from "./layout/Footer.tsx";
import SplashScreen from "./SplashScreen.tsx";

import Login from "./auth/Login.tsx";
import Register from "./auth/Register.tsx";

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

      {!hideBar && <Footer />}
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </AnimatePresence>
      {splashDone && <Layout />}
    </>
  );
}