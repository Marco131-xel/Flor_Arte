import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyData } from "../../../services/userService";
import type { UserFull } from "../../../types/user";

function IndexPerfil() {
  const [profile, setProfile] = useState<UserFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const usuarioActual = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!usuarioActual.id) {
      setError("No se pudo identificar el usuario");
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

  if (loading) return <p className="perfil-status">Cargando perfil...</p>;
  if (error) return <div className="perfil-status perfil-status--error">{error}</div>;
  if (!profile) return null;

  return (
    <div className="perfil-wrapper">
      <div className="perfil-card">
        <div className="perfil-banner">
          <img src="/images/florarte.png" alt="Flor Arte" className="perfil-avatar" />
        </div>

        <div className="perfil-body">
          <h3 className="perfil-name">{profile.name}</h3>

          <div className="perfil-badges">
            {profile.persona?.rol?.tipo && (
              <span className="perfil-badge">{profile.persona.rol.tipo}</span>
            )}
          </div>

          <div className="perfil-divider" />

          <div className="perfil-fields">
            <div className="perfil-field">
              <span><i className="bi bi-person"></i> Nombre Completo</span>
              <p>{profile.persona?.nombre || "No registrado"}</p>
            </div>

            <div className="perfil-field">
              <span><i className="bi bi-envelope"></i> Correo</span>
              <p>{profile.email}</p>
            </div>

            <div className="perfil-field">
              <span><i className="bi bi-telephone"></i> Teléfono</span>
              <p>{profile.persona?.telefono || "No registrado"}</p>
            </div>

            <div className="perfil-field">
              <span><i className="bi bi-credit-card-2-front"></i> DPI</span>
              <p>{profile.persona?.dpi || "No registrado"}</p>
            </div>
          </div>
        </div>

        <div className="perfil-actions">
          <button className="btn-perfil btn-perfil-primary" onClick={() => navigate("/empleado/perfil/cambiar-password")}>
            <i className="bi bi-key"></i> Cambiar contraseña
          </button>
          <button className="btn-perfil btn-perfil-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default IndexPerfil;