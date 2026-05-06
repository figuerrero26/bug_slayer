import { useState, useEffect } from "react";
import { DASHBOARD_URL, AUTH_URL } from "../../config.ts";
import "../../css/SettingsView.css";

// ── Types ─────────────────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  birthdateRaw?: string;
}

interface Props {
  user: User;
  onSaved: (updated: Partial<User>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTheme(): Theme {
  return (localStorage.getItem("coniiti_theme") as Theme) ?? "light";
}
function getCompact(): boolean {
  return localStorage.getItem("coniiti_compact") === "true";
}

// ── Settings View ─────────────────────────────────────────────────────────────
export default function SettingsView({ user, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "prefs">("profile");

  const TABS = [
    { id: "profile"  as const, label: "Datos de perfil"   },
    { id: "security" as const, label: "Seguridad"          },
    { id: "prefs"    as const, label: "Preferencias"       },
  ];

  return (
    <div className="stv-wrapper">
      <div className="stv-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`stv-tab${activeTab === t.id ? " stv-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="stv-body">
        {activeTab === "profile"  && <ProfilePanel  user={user} onSaved={onSaved} />}
        {activeTab === "security" && <SecurityPanel userId={user.id} />}
        {activeTab === "prefs"    && <PrefsPanel />}
      </div>
    </div>
  );
}

// ── Panel: Datos de perfil ────────────────────────────────────────────────────
function ProfilePanel({ user, onSaved }: Props) {
  const [form, setForm] = useState({
    name:      user.name,
    phone:     user.phone        ?? "",
    city:      user.city         ?? "",
    birthdate: user.birthdateRaw ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${DASHBOARD_URL}/profile/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:    form.name      || null,
          phone:        form.phone     || null,
          country_city: form.city      || null,
          birth_date:   form.birthdate || null,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved({
        name:         form.name,
        phone:        form.phone,
        city:         form.city,
        birthdateRaw: form.birthdate,
        birthdate: form.birthdate
          ? new Date(form.birthdate + "T12:00:00").toLocaleDateString("es-CO")
          : "—",
      });
      setMsg({ ok: true, text: "Perfil actualizado correctamente." });
    } catch {
      setMsg({ ok: false, text: "No se pudo guardar. Verifica tu conexión." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stv-panel">
      <div className="stv-grid">
        <div className="stv-field stv-field--full">
          <label>Nombre completo</label>
          <input className="stv-input" value={form.name} onChange={set("name")} />
        </div>
        <div className="stv-field">
          <label>Teléfono</label>
          <input className="stv-input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" />
        </div>
        <div className="stv-field">
          <label>Ciudad / País</label>
          <input className="stv-input" value={form.city} onChange={set("city")} placeholder="Bogotá, Colombia" />
        </div>
        <div className="stv-field stv-field--full">
          <label>Fecha de nacimiento</label>
          <input className="stv-input" type="date" value={form.birthdate} onChange={set("birthdate")} />
        </div>
      </div>

      {msg && <p className={`stv-msg${msg.ok ? " stv-msg--ok" : " stv-msg--err"}`}>{msg.text}</p>}

      <button className={`stv-btn-save${saving ? " stv-btn--loading" : ""}`} onClick={handleSave} disabled={saving}>
        {saving ? <><span className="stv-spinner" /> Guardando…</> : "Guardar cambios"}
      </button>
    </div>
  );
}

// ── Panel: Seguridad ──────────────────────────────────────────────────────────
function SecurityPanel({ userId }: { userId: number }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (form.next.length < 6) {
      setMsg({ ok: false, text: "La nueva contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (form.next !== form.confirm) {
      setMsg({ ok: false, text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${AUTH_URL}/auth/change-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:          userId,
          current_password: form.current,
          new_password:     form.next,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      setMsg({ ok: true, text: "Contraseña actualizada correctamente." });
      setForm({ current: "", next: "", confirm: "" });
    } catch (e: unknown) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo actualizar la contraseña." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stv-panel">
      <div className="stv-grid">
        <div className="stv-field stv-field--full">
          <label>Contraseña actual</label>
          <input className="stv-input" type="password" value={form.current} onChange={set("current")} placeholder="••••••••" />
        </div>
        <div className="stv-field">
          <label>Nueva contraseña</label>
          <input className="stv-input" type="password" value={form.next} onChange={set("next")} placeholder="Mínimo 6 caracteres" />
        </div>
        <div className="stv-field">
          <label>Confirmar nueva contraseña</label>
          <input className="stv-input" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repite la contraseña" />
        </div>
      </div>

      {msg && <p className={`stv-msg${msg.ok ? " stv-msg--ok" : " stv-msg--err"}`}>{msg.text}</p>}

      <button className={`stv-btn-save${saving ? " stv-btn--loading" : ""}`} onClick={handleSave} disabled={saving}>
        {saving ? <><span className="stv-spinner" /> Actualizando…</> : "Actualizar contraseña"}
      </button>
    </div>
  );
}

// ── Panel: Preferencias ───────────────────────────────────────────────────────
function PrefsPanel() {
  const [theme,   setTheme]   = useState<Theme>(getTheme);
  const [compact, setCompact] = useState<boolean>(getCompact);

  useEffect(() => {
    localStorage.setItem("coniiti_theme", theme);
    document.documentElement.setAttribute("data-theme", theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme
    );
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("coniiti_compact", String(compact));
    document.documentElement.classList.toggle("compact", compact);
  }, [compact]);

  const THEMES: { id: Theme; label: string; desc: string }[] = [
    { id: "light",  label: "Claro UCC",   desc: "Azul y blanco institucional" },
    { id: "dark",   label: "Oscuro UCC",  desc: "Modo nocturno con acentos dorados" },
    { id: "system", label: "Sistema",     desc: "Sigue la preferencia del dispositivo" },
  ];

  return (
    <div className="stv-panel">
      <div className="stv-section">
        <h4 className="stv-section-title">Tema de la interfaz</h4>
        <div className="stv-theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`stv-theme-btn${theme === t.id ? " stv-theme-btn--active" : ""}`}
              onClick={() => setTheme(t.id)}
            >
              <span className="stv-theme-name">{t.label}</span>
              <span className="stv-theme-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stv-section stv-divider">
        <h4 className="stv-section-title">Vista compacta</h4>
        <label className="stv-toggle">
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
          />
          <span className="stv-toggle-track">
            <span className="stv-toggle-thumb" />
          </span>
          <span className="stv-toggle-label">
            {compact ? "Activada — menos espacio entre elementos" : "Desactivada — espaciado estándar"}
          </span>
        </label>
      </div>
    </div>
  );
}
