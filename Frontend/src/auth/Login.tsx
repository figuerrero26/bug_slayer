import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Clock, ArrowLeft } from "lucide-react";

import "../css/Login.css";
import "../css/PasswordReset.css";

import ImagenFondo   from "../assets/C_C_08.jpg";
import logoUCatolica from "../assets/LOGO-LOGIN.svg";

import { AUTH_URL } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────

type LoginStep = "credentials" | "2fa";

const OTP_SECONDS = 300; // 5 min — debe coincidir con OTP_EXPIRE_MINUTES del backend

const stepVariants = {
  enter:  { opacity: 0, x: 30  },
  center: { opacity: 1, x: 0   },
  exit:   { opacity: 0, x: -30 },
};
const stepTransition = { duration: 0.22, ease: "easeInOut" };

// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";

  // ── Estado del formulario de credenciales ────────────────────────────────
  const [step,        setStep]        = useState<LoginStep>("credentials");
  const [form,        setForm]        = useState({ email: "", password: "" });
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Estado de la etapa 2FA ───────────────────────────────────────────────
  const [userId,      setUserId]      = useState<number | null>(null);
  const [otp,         setOtp]         = useState<string[]>(Array(6).fill(""));
  const [timeLeft,    setTimeLeft]    = useState(OTP_SECONDS);
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // ── Temporizador — activo solo en la etapa 2FA ───────────────────────────
  useEffect(() => {
    if (step !== "2fa") return;
    setTimeLeft(OTP_SECONDS);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Paso 1: validar credenciales ─────────────────────────────────────────
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
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Correo o contraseña incorrectos");
      } else if (data.access_token) {
        // 2FA desactivado — el backend emitió el token directamente
        sessionStorage.setItem(
          "session",
          JSON.stringify({
            token:   data.access_token,
            user_id: data.user_id,
            email:   data.email,
          })
        );
        navigate("/dashboard");
      } else if (data.status === "2fa_required") {
        setUserId(data.user_id);
        setOtp(Array(6).fill(""));
        setError("");
        setStep("2fa");
        setTimeout(() => otpRefs.current[0]?.focus(), 280);
      } else {
        setError("Respuesta inesperada del servidor");
      }
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: verificar OTP ────────────────────────────────────────────────
  const handleVerify = async (code: string) => {
    if (loading || !userId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${AUTH_URL}/auth/verify-2fa`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: userId, code }),
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
        // 429 = intentos agotados → volver al inicio
        if (response.status === 429) {
          setStep("credentials");
          setError(data.detail);
        } else {
          setError(data.detail || "Código incorrecto");
          setOtp(Array(6).fill(""));
          setTimeout(() => otpRefs.current[0]?.focus(), 50);
        }
      }
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // ── Manejadores del OTP (idénticos a PasswordReset) ──────────────────────
  const handleOtpChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");

    if (digit) {
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      } else if (next.every((d) => d !== "")) {
        handleVerify(next.join(""));
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next  = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft"  && index > 0) { otpRefs.current[index - 1]?.focus(); }
      else if (e.key === "ArrowRight" && index < 5) { otpRefs.current[index + 1]?.focus(); }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) handleVerify(text);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
        <img src={ImagenFondo}   alt="Evento CONIITI" className="login-image" />
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

        <AnimatePresence mode="wait" initial={false}>

          {/* ── Etapa 1: credenciales ─────────────────────────────────── */}
          {step === "credentials" && (
            <motion.form
              key="credentials"
              className="login-form"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              onSubmit={handleSubmit}
              noValidate
            >
              <h2>Iniciar Sesión</h2>

              {sessionExpired && (
                <p className="login-expired" role="alert" aria-live="polite">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente.
                </p>
              )}

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

            </motion.form>
          )}

          {/* ── Etapa 2: verificación 2FA ─────────────────────────────── */}
          {step === "2fa" && (
            <motion.div
              key="2fa"
              className="login-form"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
            >
              <div className="pr-header">
                <h2>Verificación en dos pasos</h2>
                <p className="pr-subtitle">
                  Enviamos un código de 6 dígitos a{" "}
                  <strong>{form.email}</strong>.{" "}
                  Introdúcelo a continuación para acceder.
                </p>
              </div>

              {error && (
                <p className="pr-error" role="alert" aria-live="assertive">
                  ⚠ {error}
                </p>
              )}

              {/* Inputs individuales de 6 dígitos */}
              <div className="pr-otp-grid" role="group" aria-label="Código de verificación">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className="pr-otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    aria-label={`Dígito ${i + 1} de 6`}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    disabled={loading || timeLeft === 0}
                  />
                ))}
              </div>

              {/* Temporizador */}
              {timeLeft > 0 ? (
                <div className={`pr-timer${timeLeft <= 60 ? " pr-timer--urgent" : ""}`}>
                  <Clock size={13} aria-hidden="true" />
                  <span>
                    El código expirará en{" "}
                    <strong>{formatTime(timeLeft)}</strong>
                  </span>
                </div>
              ) : (
                <p className="pr-error" role="alert">
                  ⚠ El código ha expirado.
                </p>
              )}

              {loading && (
                <p className="pr-checking">Verificando código…</p>
              )}

              {/* Volver al login */}
              <button
                type="button"
                className="login-2fa-back"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setOtp(Array(6).fill(""));
                }}
                disabled={loading}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Volver al inicio de sesión
              </button>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </motion.div>
  );
}
