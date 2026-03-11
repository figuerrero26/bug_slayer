import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

// ── Imágenes ──────────────────────────────────────────
import ImagenFondo from "./assets/C_C_08.jpg";
import logoUCatolica from "./assets/LOGO-LOGIN.svg";

import "./css/Auth.css";

const PAISES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Belize",
  "Benin","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland",
  "France","Georgia","Germany","Ghana","Greece","Guatemala","Haiti","Honduras","Hungary",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Latvia","Lebanon","Libya","Lithuania",
  "Luxembourg","Malaysia","Mali","Malta","Mexico","Moldova","Monaco","Morocco",
  "Mozambique","Myanmar","Nepal","Netherlands","New Zealand","Nicaragua","Nigeria",
  "North Korea","Norway","Oman","Pakistan","Palestine","Panama","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia",
  "Senegal","Serbia","Singapore","Slovakia","Slovenia","Somalia","South Africa",
  "South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zimbabwe"
];

const STEPS = [
  { id: 1, label: "Cuenta", icon: "🔐" },
  { id: 2, label: "Personal", icon: "👤" },
  { id: 3, label: "Contacto", icon: "📞" },
  { id: 4, label: "Confirmar", icon: "✅" },
];

const INITIAL = {
  username: "",
  password: "",
  confirm: "",
  full_name: "",
  birth_date: "",
  country: "",
  phone: "",
  email: "",
};

export default function Register() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setError("");
  };

  const validateStep = () => {

    if (step === 1) {
      if (form.username.trim().length < 3)
        return "El usuario debe tener al menos 3 caracteres.";
      if (form.password.length < 6)
        return "La contraseña debe tener al menos 6 caracteres.";
      if (form.password !== form.confirm)
        return "Las contraseñas no coinciden.";
    }

    if (step === 2) {
      if (!form.full_name.trim())
        return "Ingresa tu nombre completo.";
      if (!form.birth_date)
        return "Selecciona tu fecha de nacimiento.";
      if (!form.country)
        return "Selecciona tu país.";
    }

    if (step === 3) {
      if (!form.email.trim())
        return "Ingresa un correo.";
      if (!form.phone.trim())
        return "Ingresa un teléfono.";
    }

    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setStep((s) => s + 1);
  };

  const back = () => {
    setError("");
    setStep((s) => s - 1);
  };

  // ── Registro solo visual ─────────────────────────────
  const handleSubmit = () => {

    setError("");
    setLoading(true);

    setTimeout(() => {

      setLoading(false);
      setDone(true);

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    }, 1200);
  };

  // ── Pantalla de éxito ───────────────────────────────
  if (done) {
    return (
      <div className="reg-success-page">
        <motion.div
          className="reg-success-card"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="reg-success-card__icon">🎉</div>
          <h2>¡Registro exitoso!</h2>

          <p>
            Bienvenido a <strong>CONIITI 2026</strong>,{" "}
            <em>{form.full_name}</em>.
          </p>

          <p className="reg-success-card__sub">
            Redirigiendo al inicio de sesión...
          </p>

          <div className="reg-success-bar">
            <div className="reg-success-bar__fill" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="reg-container"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
    >

      {/* PANEL IZQUIERDO */}
      <div className="reg-left">

        <img src={ImagenFondo} className="reg-left__bg" />

        <img
          src={logoUCatolica}
          className="reg-left__logo"
        />

        <div className="reg-left__overlay" />

        <div className="reg-left__text">
          <h1>
            XII Congreso Internacional de Innovación y Tendencias en Ingeniería
            (CONIITI 2026)
          </h1>
          <p>Tejiendo redes para el futuro profesional</p>
        </div>

        <div className="reg-stepper">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`reg-stepper__item ${
                step === s.id ? "active" : ""
              } ${step > s.id ? "done" : ""}`}
            >
              <div className="reg-stepper__circle">
                {step > s.id ? "✓" : s.icon}
              </div>

              <span className="reg-stepper__label">
                {s.label}
              </span>

              {s.id < STEPS.length && (
                <div className="reg-stepper__line" />
              )}
            </div>
          ))}
        </div>

      </div>

      {/* PANEL DERECHO */}
      <div className="reg-right">

        <div className="reg-form-wrapper">

          <div className="reg-step-header">

            <span className="reg-step-num">
              Paso {step} de {STEPS.length}
            </span>

            <h2 className="reg-title">
              {step === 1 && "Crea tu cuenta"}
              {step === 2 && "Datos personales"}
              {step === 3 && "Información de contacto"}
              {step === 4 && "Confirma tu registro"}
            </h2>

            <p className="reg-subtitle">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="reg-link">
                Inicia sesión
              </Link>
            </p>

          </div>

          {error && (
            <div className="reg-alert">⚠ {error}</div>
          )}

          {/* CAMPOS */}
          <div className="reg-fields">

            {step === 1 && (
              <>
                <input
                  className="reg-input"
                  placeholder="Usuario"
                  value={form.username}
                  onChange={set("username")}
                />

                <input
                  className="reg-input"
                  type="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={set("password")}
                />

                <input
                  className="reg-input"
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={form.confirm}
                  onChange={set("confirm")}
                />
              </>
            )}

            {step === 2 && (
              <>
                <input
                  className="reg-input"
                  placeholder="Nombre completo"
                  value={form.full_name}
                  onChange={set("full_name")}
                />

                <input
                  className="reg-input"
                  type="date"
                  value={form.birth_date}
                  onChange={set("birth_date")}
                />

                <select
                  className="reg-input reg-select"
                  value={form.country}
                  onChange={set("country")}
                >
                  <option value="">Selecciona país</option>

                  {PAISES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </>
            )}

            {step === 3 && (
              <>
                <input
                  className="reg-input"
                  placeholder="Correo"
                  value={form.email}
                  onChange={set("email")}
                />

                <input
                  className="reg-input"
                  placeholder="Teléfono"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </>
            )}

            {step === 4 && (
              <div className="reg-summary">

                <div className="reg-summary__row">
                  <span className="reg-summary__label">
                    Usuario
                  </span>
                  <span className="reg-summary__value">
                    {form.username}
                  </span>
                </div>

                <div className="reg-summary__row">
                  <span className="reg-summary__label">
                    Nombre
                  </span>
                  <span className="reg-summary__value">
                    {form.full_name}
                  </span>
                </div>

                <div className="reg-summary__row">
                  <span className="reg-summary__label">
                    Email
                  </span>
                  <span className="reg-summary__value">
                    {form.email}
                  </span>
                </div>

              </div>
            )}

          </div>

          {/* BOTONES */}
          <div className="reg-actions">

            {step > 1 && (
              <button
                className="reg-btn reg-btn--ghost"
                onClick={back}
              >
                ← Anterior
              </button>
            )}

            {step < 4 && (
              <button
                className="reg-btn"
                onClick={next}
              >
                Siguiente →
              </button>
            )}

            {step === 4 && (
              <button
                className="reg-btn reg-btn--gold"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Registrando..." : "✓ Confirmar registro"}
              </button>
            )}

          </div>

        </div>
      </div>
    </motion.div>
  );
}