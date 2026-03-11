import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import "./css/Login.css";

import ImagenFondo from "./assets/C_C_08.jpg";
import logoUCatolica from "./assets/LOGO-LOGIN.svg";

export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value
    }));

    setError("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);

    // simulación de login
    setTimeout(() => {

      setLoading(false);

      sessionStorage.setItem(
        "user",
        JSON.stringify({
          username: form.username
        })
      );

      navigate("/");

    }, 1200);
  };

  return (

    <motion.div
      className="login-container"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >

      {/* PANEL IZQUIERDO */}
      <div className="login-left">

        <img
          src={ImagenFondo}
          alt="Evento CONIITI"
          className="login-image"
        />

        <img
          src={logoUCatolica}
          alt="Logo Universidad"
          className="logo-login"
        />

        <div className="overlay" />

        <div className="login-text">
          <h1>
            XII Congreso Internacional de Innovación y Tendencias en Ingeniería (CONIITI 2026)
          </h1>

          <p>
            Tejiendo redes para el futuro profesional
          </p>
        </div>

      </div>

      {/* PANEL DERECHO */}
      <div className="login-right">

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          <h2>Iniciar Sesión</h2>

          {error && (
            <p
              style={{
                color: "#fca5a5",
                fontSize: "0.88rem",
                margin: 0
              }}
            >
              ⚠ {error}
            </p>
          )}

          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>

          <p className="extra">
            ¿No tienes cuenta?{" "}
            <Link to="/register">
              <span>Regístrate</span>
            </Link>
          </p>

        </form>

      </div>

    </motion.div>
  );
}