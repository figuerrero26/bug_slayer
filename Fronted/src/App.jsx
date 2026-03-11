import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Nosotros from "./Nosotros";
import CrearCuenta from "./CrearCuenta";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/nosotros" element={<Nosotros />} />

      <Route path="/crear-cuenta" element={<CrearCuenta />} />

    </Routes>
  );
}

export default App;