import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUsuarioById, updateUsuario } from "../../../services/admin/usuarioService";

function UpdateUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState(true);
  const [personaNombre, setPersonaNombre] = useState("");
  const [idPersona, setIdPersona] = useState(""); // se sigue mandando al backend, pero no se edita

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
      <div className="persona-dark-container">
        <div className="persona-dark-card">
          <p className="persona-dark-cargando">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="persona-dark-container">
      <div className="persona-dark-card">
        <div className="persona-dark-header">
          <h1>Editar usuario</h1>
          <p>Actualiza el acceso al sistema</p>
        </div>

        {error && <div className="persona-dark-mensaje error">{error}</div>}
        {success && <div className="persona-dark-mensaje exito">{success}</div>}
        {aviso && <div className="persona-dark-mensaje info">{aviso}</div>}

        <form className="persona-dark-form" onSubmit={handleSubmit}>
          {/* Persona asociada: solo lectura */}
          <div className="persona-dark-group persona-dark-group-readonly">
            <label>Persona asociada</label>
            <span className="persona-dark-valor-fijo">{personaNombre}</span>
          </div>

          {/* Correo */}
          <div className="persona-dark-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese el correo"
            />
          </div>

          {/* Contraseña: ya no editable directamente */}
          <div className="persona-dark-group persona-dark-group-readonly">
            <label>Contraseña</label>
            <div className="persona-dark-password-row">
              <span className="persona-dark-valor-fijo">••••••••</span>
              <button
                type="button"
                className="persona-dark-btn-secundario"
                onClick={handleCambiarPassword}
              >
                Enviar cambio de contraseña
              </button>
            </div>
          </div>

          {/* Estado */}
          <div className="persona-dark-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={estado ? "activo" : "inactivo"}
              onChange={(e) => setEstado(e.target.value === "activo")}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {estadoCambiado && (
            <div className="persona-dark-mensaje advertencia">
              ⚠️ Vas a dejar a <strong>{personaNombre}</strong> como{" "}
              <strong>{estado ? "Activo" : "Inactivo"}</strong>.{" "}
              {estado
                ? "Podrá volver a iniciar sesión en el sistema."
                : "No podrá iniciar sesión mientras esté inactivo."}
            </div>
          )}

          <div className="persona-dark-acciones">
            <button
              type="button"
              className="persona-dark-btn-cancelar"
              onClick={() => navigate(-1)}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button type="submit" className="persona-dark-btn" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateUser;