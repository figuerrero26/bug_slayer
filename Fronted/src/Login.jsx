import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import "./css/Login.css";
import ImagenFondo from "./assets/C_C_08.jpg";
import logoUCatolica from "./assets/LOGO-LOGIN.svg";
import API_URL from "./config"
const Login = () => {

  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e) => {

  e.preventDefault()

  try {

    const response = await fetch(`${API_URL}/users/login`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        username: username,
        password: password
      })

    })

    const data = await response.json()

    console.log("Respuesta backend:", data)

    if (response.status === 200) {

      alert("Login correcto")

      navigate("/crear-cuenta")

    } else {

      alert(data.detail)

    }

  } catch (error) {

    console.error(error)

    alert("Error conectando con el servidor")

  }

}

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

        <img src={ImagenFondo} alt="Evento CONIITI" className="login-image" />

        <img src={logoUCatolica} alt="Logo Universidad" className="logo-login" />

        <div className="overlay"></div>

        <div className="login-text">
          <h1>XII Congreso Internacional de Innovación y Tendencias en Ingeniería (CONIITI 2026).</h1>
          <p>Tejiendo redes para el futuro profesional</p>
        </div>

      </div>

      {/* LADO DERECHO */}
      <div className="login-right">

        <form className="login-form" onSubmit={handleLogin}>

          <h2>Iniciar Sesión</h2>

          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button type="submit">Entrar</button>

          <p className="extra">
          ¿No tienes cuenta? <Link to="/crear-cuenta">Regístrate</Link>
          </p>

        </form>

      </div>

    </motion.div>
  );
};

export default Login;