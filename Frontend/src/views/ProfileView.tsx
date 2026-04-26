import "../css/ProfileView.css";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  birthdate?: string;
  registeredAt?: string;
}

interface Props {
  user: User;
  onEdit: () => void;
}

export default function ProfileView({ user, onEdit }: Props) {
  return (
    <div className="profv-wrapper">

      {/* Reutiliza las clases existentes de Dashboard.css */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{user.name}</h2>
            <button className="btn-edit-icon" onClick={onEdit} title="Editar perfil">
              ✏️
            </button>
          </div>

          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Fecha de registro:</span>
              <span className="detail-value">{user.registeredAt ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">País, ciudad:</span>
              <span className="detail-value">{user.country ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha de nacimiento:</span>
              <span className="detail-value">{user.birthdate ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">E-mail:</span>
              <span className="detail-value">{user.email || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Teléfono:</span>
              <span className="detail-value">{user.phone ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profv-bottom">
        <div className="bottom-grid">
          <div className="right-column">
            <div className="tickets-card">
              <h3 className="tickets-title">Mis Tickets</h3>
              <div className="tickets-empty">
                Aún no has comprado tickets para la conferencia.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
