import "../../css/ProfileView.css";

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

      <div className="profile-card">
        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{user.name}</h2>
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

        <button className="btn-edit-icon" onClick={onEdit} title="Editar perfil">
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
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
