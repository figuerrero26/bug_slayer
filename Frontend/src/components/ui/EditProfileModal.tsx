import React, { useState } from "react";
import "./EditProfileModal.css";
import type { User } from "../../interfaces/user";
import { DASHBOARD_URL } from "../../services/api";

interface Props {
  user: User;
  userId: number;
  onClose: () => void;
  onSaved: (updated: Partial<User>) => void;
}

export default function EditProfileModal({ user, userId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name:      user.name,
    phone:     user.phone        ?? "",
    city:      user.city         ?? "",
    birthdate: user.birthdateRaw ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${DASHBOARD_URL}/profile/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:    form.name      || null,
          phone:        form.phone     || null,
          country_city: form.city      || null,
          birth_date:   form.birthdate || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved({
        name:         form.name,
        phone:        form.phone,
        city:         form.city,
        country:      form.city,
        birthdateRaw: form.birthdate,
        birthdate: form.birthdate
          ? new Date(form.birthdate + "T12:00:00").toLocaleDateString("es-CO")
          : "—",
      });
      onClose();
    } catch {
      setError("No se pudo guardar. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>Editar Perfil</h2>
              <p className="modal-subtitle">{user.email}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <hr className="modal-divider" />

        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-field modal-field--full">
              <label>Nombre completo</label>
              <input className="modal-input" value={form.name} onChange={set("name")} />
            </div>
            <div className="modal-field">
              <label>Teléfono</label>
              <input className="modal-input" type="tel" value={form.phone}
                onChange={set("phone")} placeholder="+57 300 000 0000" />
            </div>
            <div className="modal-field">
              <label>Ciudad / País</label>
              <input className="modal-input" value={form.city}
                onChange={set("city")} placeholder="Bogotá, Colombia" />
            </div>
            <div className="modal-field modal-field--full">
              <label>Fecha de nacimiento</label>
              <input className="modal-input" type="date" value={form.birthdate}
                onChange={set("birthdate")} />
            </div>
            {error && <p className="modal-error">{error}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            className={`btn-modal-save${isSubmitting ? " btn-modal-save--loading" : ""}`}
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

      </div>
    </div>
  );
}
