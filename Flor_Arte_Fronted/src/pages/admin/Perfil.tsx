import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyData } from "../../services/userService";
import type { UserFull } from "../../types/user";

function Perfil() {
  const [profile, setProfile] = useState<UserFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!usuarioActual.id) {
      setError("No se pudo identificar al usuario");
      setLoading(false);
      return;
    }

    getMyData(usuarioActual.id)
      .then((data) => setProfile(data))
      .catch(() => setError("No se pudo cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!profile) return null;

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="profile-banner">
          <img src="/images/florarte.png" alt="Flor Arte" className="profile-logo" />
        </div>

        <div className="profile-body">
          <h3 className="profile-name">{profile.name}</h3>

          <div className="profile-badges">
            {profile.persona?.rol?.tipo && (
              <span className="badge-rol">{profile.persona.rol.tipo}</span>
            )}
            <span className={`badge-estado ${profile.estado ? "activo" : "inactivo"}`}>
              <i className={`bi ${profile.estado ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
              {profile.estado ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-fields">
            <div className="profile-field">
              <div className="profile-field-icon">
                <i className="bi bi-person-fill"></i>
              </div>
              <div>
                <span className="profile-field-label">Nombre completo</span>
                <p className="profile-field-value">{profile.persona?.nombre || "No registrado"}</p>
              </div>
            </div>

            <div className="profile-field">
              <div className="profile-field-icon">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <div>
                <span className="profile-field-label">Correo</span>
                <p className="profile-field-value">{profile.email}</p>
              </div>
            </div>

            <div className="profile-field">
              <div className="profile-field-icon">
                <i className="bi bi-telephone-fill"></i>
              </div>
              <div>
                <span className="profile-field-label">Teléfono</span>
                <p className="profile-field-value">{profile.persona?.telefono || "No registrado"}</p>
              </div>
            </div>

            <div className="profile-field">
              <div className="profile-field-icon">
                <i className="bi bi-card-text"></i>
              </div>
              <div>
                <span className="profile-field-label">DPI</span>
                <p className="profile-field-value">{profile.persona?.dpi || "No registrado"}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-profile-edit" onClick={() => navigate("/admin/perfil/editar")}>
              <i className="bi bi-pencil-fill"></i> Editar perfil
            </button>
            <button className="btn-profile-password" onClick={() => navigate("/admin/perfil/cambiar-password")}>
              <i className="bi bi-key-fill"></i> Cambiar contraseña
            </button>
            <button className="btn-profile-logout" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;