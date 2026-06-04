import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/Checkout.css";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as any) || {};
  const planTitle = state.title || "Inscripción CONIITI 2026";
  const amount = state.amount ?? 0;

  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();

    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);

      setTimeout(() => {
        navigate("/inscripciones");
      }, 1500);
    }, 2000);
  }

  return (
    <div className="checkout-page">

      {/* PANEL IZQUIERDO */}
      <div className="checkout-summary">

        <div className="event-badge">
          CONIITI 2026
        </div>

        <h1>{planTitle}</h1>

        <p className="summary-description">
          Congreso Internacional de Innovación,
          Ingeniería y Tecnologías de la Información
          de la Universidad Católica de Colombia.
        </p>

        <div className="price-card">
          <span>Total a pagar</span>
          <h2>
            COP {Number(amount).toLocaleString()}
          </h2>
        </div>

        <div className="benefits">
          <div>✓ Acceso completo al congreso</div>
          <div>✓ Certificado oficial</div>
          <div>✓ Material digital</div>
          <div>✓ Networking académico</div>
          <div>✓ Publicación en memorias (si aplica)</div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="checkout-payment">

        <div className="payment-header">
          <h2>Pago Seguro</h2>

          <div className="cards">
            <span className="card-brand visa">VISA</span>
            <span className="card-brand master">MC</span>
            <span className="card-brand amex">AMEX</span>
            <span className="card-brand maestro">MAESTRO</span>
          </div>
        </div>

        <div className="card-preview">
          <div className="card-chip"></div>

          <div className="card-number-preview">
            {card || "**** **** **** 4242"}
          </div>

          <div className="card-bottom">
            <div>
              <small>TITULAR</small>
              <span>{name || "NOMBRE COMPLETO"}</span>
            </div>

            <div>
              <small>EXP</small>
              <span>{exp || "MM/AA"}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handlePay}>

          <div className="input-group">
            <label>Nombre del titular</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="input-group">
            <label>Número de tarjeta</label>
            <input
              type="text"
              value={card}
              onChange={(e) => setCard(e.target.value)}
              placeholder="4242 4242 4242 4242"
              required
            />
          </div>

          <div className="row">

            <div className="input-group">
              <label>Fecha</label>
              <input
                type="text"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="MM/AA"
                required
              />
            </div>

            <div className="input-group">
              <label>CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                required
              />
            </div>

          </div>

          <button
            type="submit"
            className="pay-btn"
            disabled={processing}
          >
            {processing
              ? "Procesando pago..."
              : `Pagar COP ${Number(amount).toLocaleString()}`
            }
          </button>

          {success && (
            <div className="success-message">
              ✅ Pago realizado correctamente.
            </div>
          )}
        </form>

      </div>
    </div>
  );
}