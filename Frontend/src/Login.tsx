import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import "./css/Login.css";

import ImagenFondo from "./assets/C_C_08.jpg";
import logoUCatolica from "./assets/LOGO-LOGIN.svg";

import { AUTH_URL } from "./config";

export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(`${AUTH_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {

        sessionStorage.setItem(
          "session",
          JSON.stringify({
            token:   data.access_token,
            user_id: data.user_id,
            email:   data.email,
          })
        );

        navigate("/dashboard");

      } else {

        setError(data.detail || "Correo o contraseña incorrectos");

      }

    } catch (err) {

      console.error(err);
      setError("Error conectando con el servidor");

    } finally {

      setLoading(false);

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
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
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
            <Link to="/crear-cuenta">
              <span>Regístrate</span>
            </Link>
          </p>

        </form>

      </div>

    </motion.div>
  );
}