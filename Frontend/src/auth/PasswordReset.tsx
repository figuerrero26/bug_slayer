import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

import "../css/Login.css";
import "../css/PasswordReset.css";

import ImagenFondo   from "../assets/C_C_08.jpg";
import logoUCatolica from "../assets/LOGO-LOGIN.svg";

import { AUTH_URL } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | "success";

const TOTAL_SECONDS   = 300; // 5 min — expiración del OTP
const RESEND_COOLDOWN =  60; // 1 min — espera mínima entre reenvíos

const stepVariants = {
  enter:  { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0  },
  exit:   { opacity: 0, x: -30 },
};

const stepTransition = { duration: 0.22, ease: "easeInOut" };

// ─────────────────────────────────────────────────────────────────────────────

export default function PasswordReset() {
  const navigate = useNavigate();

  const [step,            setStep]            = useState<Step>(1);
  const [email,           setEmail]           = useState("");
  const [otp,             setOtp]             = useState<string[]>(Array(6).fill(""));
  const [resetToken,      setResetToken]      = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [timeLeft,        setTimeLeft]        = useState(TOTAL_SECONDS);
  const [resendCooldown,  setResendCooldown]  = useState(RESEND_COOLDOWN);
  const [timerKey,        setTimerKey]        = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // ── Contadores — activos únicamente en el paso 2 ────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    setTimeLeft(TOTAL_SECONDS);
    setResendCooldown(RESEND_COOLDOWN);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step, timerKey]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Paso 1 — solicitar OTP ────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${AUTH_URL}/auth/password-reset/request`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep(2);
      } else {
        const data = await res.json();
        setError(data.detail || "No se pudo enviar el código");
      }
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2 — verificar OTP ────────────────────────────────────────────────
  const handleVerify = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${AUTH_URL}/auth/password-reset/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp_code: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.reset_token);
        setStep(3);
      } else {
        setError(data.detail || "Código incorrecto o expirado");
        setOtp(Array(6).fill(""));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);

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
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
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

  const handleResend = async () => {
    setOtp(Array(6).fill(""));
    setError("");
    setLoading(true);
    try {
      await fetch(`${AUTH_URL}/auth/password-reset/request`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
    } catch { /* fire-and-forget */ }
    finally {
      setLoading(false);
      setTimerKey((k) => k + 1);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  };

  // ── Paso 3 — confirmar nueva contraseña ───────────────────────────────────
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${AUTH_URL}/auth/password-reset/confirm`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json();
        setError(data.detail || "No se pudo actualizar la contraseña");
      }
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
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
      {/* ── PANEL IZQUIERDO ─────────────────────────────────────────────── */}
      <div className="login-left">
        <img src={ImagenFondo}   alt="Evento CONIITI" className="login-image" />
        <img src={logoUCatolica} alt="Logo Universidad" className="logo-login" />
        <div className="overlay" />
        <div className="login-text">
          <h1>XII Congreso Internacional de Innovación y Tendencias en Ingeniería (CONIITI 2026)</h1>
          <p>Tejiendo redes para el futuro profesional</p>
        </div>
      </div>

      {/* ── PANEL DERECHO ───────────────────────────────────────────────── */}
      <div className="login-right">
        <Link to="/login" className="login-back">
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </Link>

        <div className="pr-card">
          <AnimatePresence mode="wait" initial={false}>

            {/* ── Paso 1: Solicitud ─────────────────────────────────── */}
            {step === 1 && (
              <motion.form
                key="step1"
                className="login-form"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                onSubmit={handleRequestOtp}
                noValidate
              >
                <div className="pr-header">
                  <h2>Restablecer contraseña</h2>
                  <p className="pr-subtitle">
                    Introduce tu correo electrónico y te enviaremos un código
                    de verificación de 6 dígitos.
                  </p>
                </div>

                {error && <p className="pr-error">⚠ {error}</p>}

                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  autoFocus
                />

                <button type="submit" disabled={loading || !email.trim()}>
                  {loading ? "Enviando…" : "Enviar código"}
                </button>
              </motion.form>
            )}

            {/* ── Paso 2: Verificación OTP ──────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                className="login-form"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
              >
                <div className="pr-header">
                  <h2>Verificar código</h2>
                  <p className="pr-subtitle">
                    Hemos enviado un código a{" "}
                    <strong>{email}</strong>.{" "}
                    Introduce los 6 dígitos a continuación.
                  </p>
                </div>

                {error && <p className="pr-error">⚠ {error}</p>}

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
                      autoFocus={i === 0}
                      aria-label={`Dígito ${i + 1} de 6`}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      disabled={loading}
                    />
                  ))}
                </div>

                <div className={`pr-timer${timeLeft <= 60 ? " pr-timer--urgent" : ""}`}>
                  <Clock size={13} />
                  <span>
                    El código expirará en{" "}
                    <strong>{formatTime(timeLeft)}</strong>
                  </span>
                </div>

                {loading && (
                  <p className="pr-checking">Verificando código…</p>
                )}

                {resendCooldown > 0 && (
                  <p className="pr-checking">
                    Puedes reenviar el código en{" "}
                    <strong>{formatTime(resendCooldown)}</strong>
                  </p>
                )}

                <button
                  type="button"
                  className="pr-resend"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                >
                  Reenviar código
                </button>
              </motion.div>
            )}

            {/* ── Paso 3: Nueva contraseña ──────────────────────────── */}
            {step === 3 && (
              <motion.form
                key="step3"
                className="login-form"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                onSubmit={handleConfirm}
                noValidate
              >
                <div className="pr-header">
                  <div className="pr-shield-icon" aria-hidden="true">
                    <ShieldCheck size={24} strokeWidth={1.5} />
                  </div>
                  <h2>Nueva contraseña</h2>
                  <p className="pr-subtitle">
                    Elige una contraseña segura de al menos 8 caracteres.
                  </p>
                </div>

                {error && <p className="pr-error">⚠ {error}</p>}

                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  autoComplete="new-password"
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? "Actualizando…" : "Actualizar contraseña"}
                </button>
              </motion.form>
            )}

            {/* ── Éxito ─────────────────────────────────────────────── */}
            {step === "success" && (
              <motion.div
                key="success"
                className="login-form pr-success"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
              >
                <div className="pr-success-icon" aria-hidden="true">
                  <CheckCircle2 size={32} strokeWidth={1.5} />
                </div>
                <h2>¡Contraseña actualizada!</h2>
                <p className="pr-subtitle">
                  Tu contraseña ha sido restablecida exitosamente. Ya puedes
                  iniciar sesión con tus nuevas credenciales.
                </p>
                <button type="button" onClick={() => navigate("/login")}>
                  Ir al inicio de sesión
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
