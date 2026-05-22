import { useState, useEffect } from "react";
import { DASHBOARD_URL, AUTH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./SettingsView.css";

import type { User } from "../../interfaces/user";

// ── Types ─────────────────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";

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
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "prefs">("profile");

  const TABS = [
    { id: "profile"  as const, label: t.stv_tab_profile  },
    { id: "security" as const, label: t.stv_tab_security },
    { id: "prefs"    as const, label: t.stv_tab_prefs    },
  ];

  return (
    <div className="stv-wrapper">
      <div className="stv-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`stv-tab${activeTab === tab.id ? " stv-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
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
  const { t } = useLang();
  const [form, setForm] = useState({
    name:      user.name,
    phone:     user.phone        ?? "",
    city:      user.city         ?? "",
    birthdate: user.birthdateRaw ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

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
      setMsg({ ok: true, text: t.stv_saved_ok });
    } catch {
      setMsg({ ok: false, text: t.stv_save_error });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stv-panel">
      <div className="stv-grid">
        <div className="stv-field stv-field--full">
          <label>{t.stv_field_name}</label>
          <input className="stv-input" value={form.name} onChange={set("name")} />
        </div>
        <div className="stv-field">
          <label>{t.stv_field_phone}</label>
          <input className="stv-input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" />
        </div>
        <div className="stv-field">
          <label>{t.stv_field_city}</label>
          <input className="stv-input" value={form.city} onChange={set("city")} placeholder="Bogotá, Colombia" />
        </div>
        <div className="stv-field stv-field--full">
          <label>{t.stv_field_birthdate}</label>
          <input className="stv-input" type="date" value={form.birthdate} onChange={set("birthdate")} />
        </div>
      </div>

      {msg && <p className={`stv-msg${msg.ok ? " stv-msg--ok" : " stv-msg--err"}`}>{msg.text}</p>}

      <button className={`stv-btn-save${saving ? " stv-btn--loading" : ""}`} onClick={handleSave} disabled={saving}>
        {saving ? <><span className="stv-spinner" /> {t.stv_saving}</> : t.stv_save}
      </button>
    </div>
  );
}

// ── Panel: Seguridad ──────────────────────────────────────────────────────────
function SecurityPanel({ userId }: { userId: number }) {
  const { t } = useLang();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (form.next.length < 6) {
      setMsg({ ok: false, text: t.stv_pwd_short });
      return;
    }
    if (form.next !== form.confirm) {
      setMsg({ ok: false, text: t.stv_pwd_mismatch });
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
      if (!res.ok) throw new Error(data.detail ?? t.stv_pwd_error);
      setMsg({ ok: true, text: t.stv_pwd_ok });
      setForm({ current: "", next: "", confirm: "" });
    } catch (e: unknown) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : t.stv_pwd_error });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stv-panel">
      <div className="stv-grid">
        <div className="stv-field stv-field--full">
          <label>{t.stv_field_cur_pwd}</label>
          <input className="stv-input" type="password" value={form.current} onChange={set("current")} placeholder="••••••••" />
        </div>
        <div className="stv-field">
          <label>{t.stv_field_new_pwd}</label>
          <input className="stv-input" type="password" value={form.next} onChange={set("next")} placeholder={t.stv_pwd_min_hint} />
        </div>
        <div className="stv-field">
          <label>{t.stv_field_confirm_pwd}</label>
          <input className="stv-input" type="password" value={form.confirm} onChange={set("confirm")} placeholder={t.stv_pwd_repeat_hint} />
        </div>
      </div>

      {msg && <p className={`stv-msg${msg.ok ? " stv-msg--ok" : " stv-msg--err"}`}>{msg.text}</p>}

      <button className={`stv-btn-save${saving ? " stv-btn--loading" : ""}`} onClick={handleSave} disabled={saving}>
        {saving ? <><span className="stv-spinner" /> {t.stv_updating}</> : t.stv_update_pwd}
      </button>
    </div>
  );
}

// ── Panel: Preferencias ───────────────────────────────────────────────────────
function PrefsPanel() {
  const { t } = useLang();
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
    { id: "light",  label: t.stv_theme_light,  desc: t.stv_theme_light_desc  },
    { id: "dark",   label: t.stv_theme_dark,   desc: t.stv_theme_dark_desc   },
    { id: "system", label: t.stv_theme_system, desc: t.stv_theme_system_desc },
  ];

  return (
    <div className="stv-panel">
      <div className="stv-section">
        <h4 className="stv-section-title">{t.stv_theme_title}</h4>
        <div className="stv-theme-grid">
          {THEMES.map((th) => (
            <button
              key={th.id}
              className={`stv-theme-btn${theme === th.id ? " stv-theme-btn--active" : ""}`}
              onClick={() => setTheme(th.id)}
            >
              <span className="stv-theme-name">{th.label}</span>
              <span className="stv-theme-desc">{th.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stv-section stv-divider">
        <h4 className="stv-section-title">{t.stv_compact_title}</h4>
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
            {compact ? t.stv_compact_on : t.stv_compact_off}
          </span>
        </label>
      </div>
    </div>
  );
}
