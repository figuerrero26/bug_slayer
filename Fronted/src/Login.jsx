import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./css/Login.css";
import ImagenFondo from "./assets/C_C_08.jpg";
import logoUCatolica from "./assets/LOGO-LOGIN.svg";

const Login = () => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();

      try {
      const response = await fetch("http://127.0.0.1:8000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      localStorage.setItem("token", data.access_token);
      getMe();
      navigate("/");
      console.log("Respuesta login:", data);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  const getMe = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://127.0.0.1:8000/users/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      setUser(data);
      console.log("Usuario autenticado:", data);

    } catch (error) {
      console.error("Error consultando /users/me:", error);
    }
  };

  
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
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Iniciar Sesión</h2>

          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Entrar</button>

          <p className="extra">
            ¿No tienes cuenta? <span>Regístrate</span>
          </p>
          {user && (
            <p className="extra">
              Bienvenido, <strong>{user.username}</strong>
          </p>
          )}

        </form>
      </div>

    </motion.div>
  );
};

export default Login;
