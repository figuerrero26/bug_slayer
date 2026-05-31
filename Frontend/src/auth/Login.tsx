import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

import "../css/Login.css";

import ImagenFondo from "../assets/C_C_08.jpg";
import logoUCatolica from "../assets/LOGO-LOGIN.svg";

import { AUTH_URL } from "../services/api";

export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        body: JSON.stringify({ email: form.email, password: form.password }),
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
    } catch {
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
        <img src={ImagenFondo} alt="Evento CONIITI" className="login-image" />
        <img src={logoUCatolica} alt="Logo Universidad" className="logo-login" />
        <div className="overlay" />
        <div className="login-text">
          <h1>
            XII Congreso Internacional de Innovación y Tendencias en Ingeniería (CONIITI 2026)
          </h1>
          <p>Tejiendo redes para el futuro profesional</p>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="login-right">

        <Link to="/" className="login-back">
          <FaArrowLeft aria-hidden="true" /> Volver al inicio
        </Link>

        <form className="login-form" onSubmit={handleSubmit} noValidate>

          <h2>Iniciar Sesión</h2>

          {error && (
            <p className="login-error" role="alert" aria-live="assertive">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#fca5a5" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6v3.5M8 11v.5" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </p>
          )}

          <div className="login-field">
            <label htmlFor="login-email" className="login-label">
              Correo electrónico
            </label>
            <div className="input-group">
              <FaEnvelope className="input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="tuconiiti@correo.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              Contraseña
            </label>
            <div className="input-group input-group--has-eye">
              <FaLock className="input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <p className="extra login-forgot">
            <Link to="/recuperar-contrasena">
              <span>¿Olvidaste tu contraseña?</span>
            </Link>
          </p>

          <button type="submit" disabled={loading}>
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
