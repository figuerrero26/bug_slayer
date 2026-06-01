import { lazy, Suspense, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LanguageProvider } from "./context/LanguageContext";
import { getSession } from "./hooks/useSession";

import Barra          from "./layout/Barra.tsx";
import Footer         from "./layout/Footer.tsx";
import SplashScreen   from "./SplashScreen.tsx";
import RogelioWidget  from "./dashboard/rogelio/RogelioWidget.tsx";

const Home          = lazy(() => import("./pages/home/Home.tsx"));
const Nosotros      = lazy(() => import("./pages/nosotros/Nosotros.tsx"));
const Ferias        = lazy(() => import("./pages/ferias/Ferias.tsx"));
const Inscripciones = lazy(() => import("./pages/inscripciones/Inscripciones.tsx"));
const Noticias      = lazy(() => import("./pages/noticias/Noticias.tsx"));
const Ponentes      = lazy(() => import("./pages/ponentes/Ponentes.tsx"));
const Coniiti2015   = lazy(() => import("./pages/ferias/Coniiti2015.tsx"));
const Dashboard     = lazy(() => import("./dashboard/Dashboard.tsx"));
const Admin         = lazy(() => import("./admin/Admin.tsx"));
const Login          = lazy(() => import("./auth/Login.tsx"));
const Register       = lazy(() => import("./auth/Register.tsx"));
const PasswordReset  = lazy(() => import("./auth/PasswordReset.tsx"));

function Layout() {

  const location = useLocation();
  const session  = getSession();
  const userId   = session?.user_id ?? null;

  const hideBar =
    location.pathname === "/login" ||
    location.pathname === "/crear-cuenta" ||
    location.pathname === "/recuperar-contrasena" ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/admin");

  return (
    <>
      {!hideBar && <Barra />}

      <Suspense fallback={<div style={{ minHeight: "80vh" }} />}>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/ferias" element={<Ferias />} />
          <Route path="/inscripciones" element={<Inscripciones />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/ponentes" element={<Ponentes />} />
          <Route path="/coniiti2015" element={<Coniiti2015 />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<Register />} />
          <Route path="/recuperar-contrasena" element={<PasswordReset />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Admin — ruta oculta, sin enlace en navegación, sin autenticación */}
          <Route path="/admin/conferences" element={<Admin />} />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>

      {!hideBar && <Footer />}
      {!hideBar && <RogelioWidget userId={userId} />}
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <LanguageProvider>
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </AnimatePresence>
      {splashDone && <Layout />}
    </LanguageProvider>
  );
}
