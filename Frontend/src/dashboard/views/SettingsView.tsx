import { useState, useEffect, useRef } from "react";
import {
  User, Phone, MapPin, Calendar, Lock, Eye, EyeOff,
  Camera, ShieldCheck, Monitor, Sun, Moon, Bell, Clock,
} from "lucide-react";
import { DASHBOARD_URL, AUTH_URL } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import "./SettingsView.css";

import type { User as UserType } from "../../interfaces/user";

// ── Types ─────────────────────────────────────────────────────────────────────
type Theme   = "light" | "dark";
type TimeFmt = "12"    | "24";

interface Props {
  user:    UserType;
  onSaved: (updated: Partial<UserType>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTheme      = (): Theme   => (localStorage.getItem("coniiti_theme")        as Theme)   ?? "light";
const get2FA        = (): boolean => localStorage.getItem("coniiti_2fa")            !== "false";   // true por defecto
const getNotifConf  = (): boolean => localStorage.getItem("coniiti_notif_conf")     !== "false";
const getNotifCnl   = (): boolean => localStorage.getItem("coniiti_notif_cancel")   !== "false";
const getTimeFmt    = (): TimeFmt => (localStorage.getItem("coniiti_timefmt")       as TimeFmt) ?? "12";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Shared sub-components ────────────────────────────────────────────────────

function InputField({
  label, icon, type = "text", value, onChange, placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="stv-field">
      <label className="stv-label">{label}</label>
      <div className="stv-input-wrap">
        <span className="stv-input-icon">{icon}</span>
        <input
          className="stv-input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="stv-field">
      <label className="stv-label">{label}</label>
      <div className="stv-input-wrap">
        <span className="stv-input-icon"><Lock size={15} /></span>
        <input
          className="stv-input stv-input--pwd"
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button type="button" className="stv-pwd-eye" onClick={() => setShow(s => !s)}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  checked, onChange, label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="stv-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="stv-toggle-track">
        <span className="stv-toggle-thumb" />
      </span>
      {label && <span className="stv-toggle-label">{label}</span>}
    </label>
  );
}

// ── SettingsView ──────────────────────────────────────────────────────────────
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
      <div className="stv-card">
        <div className="stv-tabs">
          {TABS.map(tab => (
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
    </div>
  );
}

// ── Panel: Datos de perfil ────────────────────────────────────────────────────
function ProfilePanel({ user, onSaved }: Props) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
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
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
  };

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

      {/* ── Avatar ── */}
      <div className="stv-avatar-area">
        <div className="stv-avatar">
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" className="stv-avatar-img" />
            : <span className="stv-avatar-initials">{initials(user.name)}</span>
          }
        </div>
        <button type="button" className="stv-avatar-btn" onClick={() => fileRef.current?.click()}>
          <Camera size={12} />
          {t.stv_avatar_change}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="stv-hidden-input"
          onChange={handleFile}
        />
      </div>

      {/* ── Nombre completo ── */}
      <InputField
        label={t.stv_field_name}
        icon={<User size={15} />}
        value={form.name}
        onChange={set("name")}
      />

      {/* ── Teléfono + Ciudad ── */}
      <div className="stv-grid">
        <InputField
          label={t.stv_field_phone}
          icon={<Phone size={15} />}
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          placeholder="+57 300 000 0000"
        />
        <InputField
          label={t.stv_field_city}
          icon={<MapPin size={15} />}
          value={form.city}
          onChange={set("city")}
          placeholder="Bogotá, Colombia"
        />
      </div>

      {/* ── Fecha de nacimiento ── */}
      <InputField
        label={t.stv_field_birthdate}
        icon={<Calendar size={15} />}
        type="date"
        value={form.birthdate}
        onChange={set("birthdate")}
      />

      {msg && (
        <p className={`stv-msg${msg.ok ? " stv-msg--ok" : " stv-msg--err"}`}>{msg.text}</p>
      )}

      <div className="stv-btn-row">
        <button
          className={`stv-btn-save${saving ? " stv-btn--loading" : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <><span className="stv-spinner" /> {t.stv_saving}</> : t.stv_save}
        </button>
      </div>
    </div>
  );
}

// ── Panel: Seguridad ──────────────────────────────────────────────────────────
function SecurityPanel({ userId }: { userId: number }) {
  const { t } = useLang();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [twoFA, setTwoFA]   = useState(get2FA);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (form.next.length < 6) { setMsg({ ok: false, text: t.stv_pwd_short });    return; }
    if (form.next !== form.confirm) { setMsg({ ok: false, text: t.stv_pwd_mismatch }); return; }
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

  const handleToggle2FA = async (v: boolean) => {
    setTwoFA(v);
    localStorage.setItem("coniiti_2fa", String(v));
    try {
      await fetch(`${AUTH_URL}/auth/2fa`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: userId, enabled: v }),
      });
    } catch {
      // si falla la red, el estado local ya refleja la preferencia del usuario;
      // se sincronizará al próximo login
    }
  };

  const SESSIONS = [
    { browser: "Chrome · Windows", location: "Bogotá, Colombia", time: "Ahora"        },
    { browser: "Safari · iPhone",  location: "Bogotá, Colombia", time: "Hace 2 días"  },
  ];

  return (
    <div className="stv-panel">

      {/* ── Contraseña actual ── */}
      <PasswordField
        label={t.stv_field_cur_pwd}
        value={form.current}
        onChange={set("current")}
        placeholder="••••••••"
      />

      {/* ── Nueva + Confirmar ── */}
      <div className="stv-grid">
        <PasswordField
          label={t.stv_field_new_pwd}
          value={form.next}
          onChange={set("next")}
          placeholder={t.stv_pwd_min_hint}
        />
        <PasswordField
          label={t.stv_field_confirm_pwd}
          value={form.confirm}
          onChange={set("confirm")}
          placeholder={t.stv_pwd_repeat_hint}
        />
      </div>

      {msg && (
        <p className={`stv-msg${msg.ok ? " stv-msg--ok" : " stv-msg--err"}`}>{msg.text}</p>
      )}

      <button
        className={`stv-btn-save${saving ? " stv-btn--loading" : ""}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <><span className="stv-spinner" /> {t.stv_updating}</> : t.stv_update_pwd}
      </button>

      {/* ── 2FA ── */}
      <div className="stv-divider-section">
        <div className="stv-section-header">
          <ShieldCheck size={17} className="stv-section-icon" />
          <h4 className="stv-section-title">{t.stv_2fa_title}</h4>
        </div>
        <div className="stv-2fa-row">
          <Toggle
            checked={twoFA}
            onChange={handleToggle2FA}
            label={twoFA ? t.stv_2fa_enabled : t.stv_2fa_disabled}
          />
        </div>
        <p className="stv-section-desc">{t.stv_2fa_desc}</p>
      </div>

      {/* ── Sesiones activas ── */}
      <div className="stv-divider-section">
        <div className="stv-section-header">
          <Monitor size={17} className="stv-section-icon" />
          <h4 className="stv-section-title">{t.stv_sessions_title}</h4>
        </div>
        <div className="stv-sessions">
          {SESSIONS.map((s, i) => (
            <div key={i} className="stv-session">
              <div className="stv-session-info">
                <span className="stv-session-browser">{s.browser}</span>
                <span className="stv-session-location">{s.location} · {s.time}</span>
              </div>
              <span className="stv-session-badge">{t.stv_session_badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel: Preferencias ───────────────────────────────────────────────────────
function PrefsPanel() {
  const { t } = useLang();
  const [theme,       setThemeState] = useState<Theme>(getTheme);
  const [notifConf,   setNotifConf]  = useState(getNotifConf);
  const [notifCancel, setNotifCnl]   = useState(getNotifCnl);
  const [timeFmt,     setTimeFmt]    = useState<TimeFmt>(getTimeFmt);

  useEffect(() => {
    localStorage.setItem("coniiti_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("coniiti_notif_conf", String(notifConf));
  }, [notifConf]);

  useEffect(() => {
    localStorage.setItem("coniiti_notif_cancel", String(notifCancel));
  }, [notifCancel]);

  useEffect(() => {
    localStorage.setItem("coniiti_timefmt", timeFmt);
  }, [timeFmt]);

  const THEMES: { id: Theme; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "light", label: t.stv_theme_light, desc: t.stv_theme_light_desc, icon: <Sun  size={24} /> },
    { id: "dark",  label: t.stv_theme_dark,  desc: t.stv_theme_dark_desc,  icon: <Moon size={24} /> },
  ];

  return (
    <div className="stv-panel">

      {/* ── Tema ── */}
      <div className="stv-section">
        <div className="stv-section-header">
          <Sun size={17} className="stv-section-icon" />
          <h4 className="stv-section-title">{t.stv_theme_title}</h4>
        </div>
        <div className="stv-theme-grid">
          {THEMES.map(th => (
            <button
              key={th.id}
              className={`stv-theme-btn${theme === th.id ? " stv-theme-btn--active" : ""}`}
              onClick={() => setThemeState(th.id)}
            >
              <span className="stv-theme-icon">{th.icon}</span>
              <span className="stv-theme-name">{th.label}</span>
              <span className="stv-theme-desc">{th.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Notificaciones ── */}
      <div className="stv-divider-section">
        <div className="stv-section-header">
          <Bell size={17} className="stv-section-icon" />
          <h4 className="stv-section-title">{t.stv_notif_title}</h4>
        </div>
        <div className="stv-checkboxes">
          <label className="stv-checkbox">
            <input
              type="checkbox"
              checked={notifConf}
              onChange={e => setNotifConf(e.target.checked)}
            />
            <span className="stv-checkbox-box" />
            <span className="stv-checkbox-label">{t.stv_notif_conf}</span>
          </label>
          <label className="stv-checkbox">
            <input
              type="checkbox"
              checked={notifCancel}
              onChange={e => setNotifCnl(e.target.checked)}
            />
            <span className="stv-checkbox-box" />
            <span className="stv-checkbox-label">{t.stv_notif_cancel}</span>
          </label>
        </div>
      </div>

      {/* ── Formato de hora ── */}
      <div className="stv-divider-section">
        <div className="stv-section-header">
          <Clock size={17} className="stv-section-icon" />
          <h4 className="stv-section-title">{t.stv_timefmt_title}</h4>
        </div>
        <div className="stv-timefmt-btns">
          <button
            className={`stv-timefmt-btn${timeFmt === "12" ? " stv-timefmt-btn--active" : ""}`}
            onClick={() => setTimeFmt("12")}
          >
            {t.stv_timefmt_12}
          </button>
          <button
            className={`stv-timefmt-btn${timeFmt === "24" ? " stv-timefmt-btn--active" : ""}`}
            onClick={() => setTimeFmt("24")}
          >
            {t.stv_timefmt_24}
          </button>
        </div>
      </div>
    </div>
  );
}
