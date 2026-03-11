import React from "react";
import { motion } from "framer-motion";
import "./css/Login.css";
import ImagenFondo from "./assets/C_C_08.jpg";
import logoUCatolica from "./assets/LOGO-LOGIN.svg";

const Login = () => {
  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.6, ease: "easeOut" }}    
    >
      {/* LADO IZQUIERDO */}
      <div className="login-left">
      {/* IMAGEN DE FONDO */}
        <img src={ImagenFondo} alt="Evento CONIITI" className="login-image" />
      {/* LOGO UNIVERSIDAD */}
        <img src={logoUCatolica} alt="Logo Universidad" className="logo-login" />
        <div className="overlay"></div>

        <div className="login-text">
          <h1>XII Congreso Internacional de Innovación y Tendencias en Ingeniería (CONIITI 2026).</h1>
          <p>Tejiendo redes para el futuro profesional</p>
        </div>
      </div>

      {/* LADO DERECHO */}
      <div className="login-right">
        <form className="login-form">
          <h2>Iniciar Sesión F</h2>

          <input
            type="text"
            placeholder="Usuario"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            required
          />

          <button type="submit">Entrar</button>

          <p className="extra">
            ¿No tienes cuenta? <span>Regístrate</span>
          </p>
        </form>
      </div>

    </motion.div>
  );
};

export default Login;
