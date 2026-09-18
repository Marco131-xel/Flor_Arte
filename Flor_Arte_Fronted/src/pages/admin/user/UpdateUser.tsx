import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUsuarioById, updateUsuario } from "../../../services/admin/usuarioService";

function UpdateUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState(true);
  const [personaNombre, setPersonaNombre] = useState("");
  const [idPersona, setIdPersona] = useState("");

  const [estadoOriginal, setEstadoOriginal] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const usuario = await getUsuarioById(Number(id));

      setEmail(usuario.email);
      setEstado(usuario.estado);
      setEstadoOriginal(usuario.estado);
      setIdPersona(String(usuario.idPersona));
      setPersonaNombre(usuario.persona.nombre);
    } catch (error) {
      console.error("Error al cargar el usuario:", error);
      setError("No se pudo cargar la información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const estadoCambiado = estado !== estadoOriginal;

  const handleCambiarPassword = () => {
    // TODO: cuando el backend tenga el endpoint, esto disparará
    // el envío de un correo de restablecimiento de contraseña.
    setAviso("Se enviará un correo al usuario para que restablezca su contraseña (función en desarrollo).");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError("El correo es obligatorio");
      return;
    }

    if (estadoCambiado) {
      const confirmado = window.confirm(
        `Vas a ${estado ? "activar" : "desactivar"} a "${personaNombre}".\n\n${
          estado
            ? "El usuario podrá volver a iniciar sesión en el sistema."
            : "El usuario no podrá iniciar sesión mientras esté inactivo."
        }\n\n¿Deseas continuar?`
      );
      if (!confirmado) return;
    }

    try {
      setGuardando(true);

      await updateUsuario(Number(id), {
        email,
        estado,
        idPersona,
      });

      setSuccess("Usuario actualizado exitosamente");
      setEstadoOriginal(estado);
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Ocurrió un error al actualizar el usuario");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-card">
          <p className="cp-cargando">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <div className="cp-card">
        <div className="cp-header">
          <h1 className="cp-title">Editar usuario</h1>
          <p className="cp-subtitle">Actualiza el acceso al sistema</p>
        </div>

        {error && <div className="cp-alert cp-alert-error">{error}</div>}
        {success && <div className="cp-alert cp-alert-success">{success}</div>}
        {aviso && <div className="cp-alert cp-alert-info">{aviso}</div>}

        <form className="cp-form" onSubmit={handleSubmit} noValidate>
          {/* Persona asociada: solo lectura */}
          <div className="cp-field cp-field-readonly">
            <label className="cp-label">
              <i className="bi bi-person-badge-fill"></i> Persona asociada
            </label>
            <span className="cp-value-fixed">{personaNombre}</span>
          </div>

          {/* Correo */}
          <div className="cp-field">
            <label htmlFor="email" className="cp-label">
              <i className="bi bi-envelope-fill"></i> Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese el correo"
              className="cp-input"
            />
          </div>

          {/* Contraseña: ya no editable directamente */}
          <div className="cp-field cp-field-readonly">
            <label className="cp-label">
              <i className="bi bi-key-fill"></i> Contraseña
            </label>
            <div className="cp-password-row">
              <span className="cp-value-fixed">••••••••</span>
              <button type="button" className="cp-btn-inline" onClick={handleCambiarPassword}>
                Enviar cambio de contraseña
              </button>
            </div>
          </div>

          {/* Estado */}
          <div className="cp-field">
            <label htmlFor="estado" className="cp-label">
              <i className="bi bi-toggle2-on"></i> Estado
            </label>
            <select
              id="estado"
              value={estado ? "activo" : "inactivo"}
              onChange={(e) => setEstado(e.target.value === "activo")}
              className="cp-select"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {estadoCambiado && (
            <div className="cp-mensaje-advertencia">
              <i className="bi bi-exclamation-triangle-fill"></i> Vas a dejar a{" "}
              <strong>{personaNombre}</strong> como <strong>{estado ? "Activo" : "Inactivo"}</strong>.{" "}
              {estado
                ? "Podrá volver a iniciar sesión en el sistema."
                : "No podrá iniciar sesión mientras esté inactivo."}
            </div>
          )}

          <div className="cp-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={guardando}
              className="cp-btn-secondary"
            >
              Cancelar
            </button>

            <button type="submit" disabled={guardando} className="cp-btn-primary">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateUser;