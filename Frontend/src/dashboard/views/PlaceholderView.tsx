import { useLang } from "../../context/LanguageContext";
import "./PlaceholderView.css";

export default function PlaceholderView({ section }: { section: string }) {
  const { t } = useLang();

  const SECTIONS: Record<string, { icon: string; title: string; message: string }> = {
    favorites: {
      icon:    "⭐",
      title:   t.ph_favorites_title,
      message: t.ph_favorites_msg,
    },
    events: {
      icon:    "🎟️",
      title:   t.ph_events_title,
      message: t.ph_system_ready,
    },
    completed: {
      icon:    "✅",
      title:   t.ph_completed_title,
      message: t.ph_system_ready,
    },
    messages: {
      icon:    "💬",
      title:   t.dash_messages,
      message: t.ph_system_ready,
    },
  };

  const info = SECTIONS[section] ?? {
    icon:    "🔧",
    title:   t.ph_dev_title,
    message: t.ph_dev_msg,
  };

  return (
    <div className="ph-wrapper">
      <div className="ph-card">
        <div className="ph-icon">{info.icon}</div>
        <h2 className="ph-title">{info.title}</h2>
        <p className="ph-message">{info.message}</p>
        <span className="ph-badge">{t.ph_soon}</span>
      </div>
    </div>
  );
}
