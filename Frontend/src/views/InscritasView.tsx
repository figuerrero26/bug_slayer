import { useState, useEffect } from "react";
import { SEARCH_URL } from "../config";
import "../css/InscritasView.css";

interface Conference {
  id: number;
  title: string;
  speaker_name: string | null;
  speaker_image_url: string | null;
  category: string | null;
  schedule: string | null;
  location_text: string | null;
  registration_id: number;
  registration_status: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Por definir";
  return new Date(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InscritasView({ userId }: { userId: number }) {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch(`${SEARCH_URL}/users/${userId}/conferences`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las conferencias");
        return res.json();
      })
      .then(setConferences)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="inscr-center">
        <div className="inscr-spinner" />
        <p>Cargando tus conferencias…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inscr-center inscr-error">
        <span className="inscr-icon">⚠</span>
        <p>{error}</p>
      </div>
    );
  }

  if (conferences.length === 0) {
    return (
      <div className="inscr-center">
        <span className="inscr-icon">📭</span>
        <h3 className="inscr-empty-title">Sin conferencias inscritas</h3>
        <p className="inscr-empty-sub">
          Explora el catálogo y regístrate en las que más te interesen.
        </p>
      </div>
    );
  }

  return (
    <div className="inscr-container">

      <h2 className="inscr-section-title">
        Mis Conferencias
        <span className="inscr-count">{conferences.length}</span>
      </h2>

      <div className="inscr-grid">
        {conferences.map((conf) => {
          const isPast = conf.schedule
            ? new Date(conf.schedule) < new Date()
            : false;

          return (
            <article key={conf.id} className={`inscr-card ${isPast ? "inscr-card--done" : ""}`}>

              {conf.category && (
                <span className="inscr-badge-cat">{conf.category}</span>
              )}

              <span className={`inscr-badge-status ${isPast ? "inscr-status--done" : "inscr-status--upcoming"}`}>
                {isPast ? "Completada" : "Próxima"}
              </span>

              <h3 className="inscr-card-title">{conf.title}</h3>

              {conf.speaker_name && (
                <div className="inscr-speaker">
                  {conf.speaker_image_url ? (
                    <img
                      src={`${SEARCH_URL}${conf.speaker_image_url}`}
                      alt={conf.speaker_name}
                      className="inscr-avatar"
                    />
                  ) : (
                    <div className="inscr-avatar inscr-avatar--initials">
                      {conf.speaker_name[0].toUpperCase()}
                    </div>
                  )}
                  <span className="inscr-speaker-name">{conf.speaker_name}</span>
                </div>
              )}

              <ul className="inscr-meta">
                {conf.schedule && (
                  <li>
                    <span className="inscr-meta-icon">📅</span>
                    {formatDate(conf.schedule)}
                  </li>
                )}
                {conf.location_text && (
                  <li>
                    <span className="inscr-meta-icon">📍</span>
                    {conf.location_text}
                  </li>
                )}
              </ul>

            </article>
          );
        })}
      </div>
    </div>
  );
}
