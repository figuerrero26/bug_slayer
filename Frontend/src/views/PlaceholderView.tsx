import "../css/PlaceholderView.css";

interface SectionInfo {
  icon: string;
  title: string;
  message: string;
}

const SECTIONS: Record<string, SectionInfo> = {
  favorites: {
    icon: "⭐",
    title: "Favoritos",
    message: "Función de favoritos próximamente disponible.",
  },
  events: {
    icon: "🎟️",
    title: "Eventos",
    message: "El sistema está listo para recibir estos datos en la siguiente fase del proyecto.",
  },
  completed: {
    icon: "✅",
    title: "Completadas",
    message: "El sistema está listo para recibir estos datos en la siguiente fase del proyecto.",
  },
  messages: {
    icon: "💬",
    title: "Mensajes",
    message: "El sistema está listo para recibir estos datos en la siguiente fase del proyecto.",
  },
};

export default function PlaceholderView({ section }: { section: string }) {
  const info = SECTIONS[section] ?? {
    icon: "🔧",
    title: "Sección en desarrollo",
    message: "Esta funcionalidad estará disponible próximamente.",
  };

  return (
    <div className="ph-wrapper">
      <div className="ph-card">
        <div className="ph-icon">{info.icon}</div>
        <h2 className="ph-title">{info.title}</h2>
        <p className="ph-message">{info.message}</p>
        <span className="ph-badge">Próximamente</span>
      </div>
    </div>
  );
}
